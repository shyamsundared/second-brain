// Background job that makes saved links searchable.
// Saving content only inserts a row with status "pending". This loop picks those rows up,
// fetches their text, splits it into chunks, embeds everything and marks the row "ready".
// The queue is the Content table itself: FOR UPDATE SKIP LOCKED means several workers could
// run at once without two of them taking the same row.
import { prisma } from "../lib/prisma.js";
import { getLinkText, type TranscriptLine } from "./linkText.js";
import { embed, toVector } from "./embed.js";

const MAX_ATTEMPTS = 3;
const IDLE_MS = 1000;
const CHUNK_SECONDS = 45; // transcript window per chunk: long enough for context, short enough to point at a moment
const CHUNK_CHARS = 800;  // the embedding model only reads ~256 tokens, so keep text chunks small

interface Piece {
  text: string;
  startSeconds: number | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Group transcript lines into ~45 second pieces, each remembering where it starts
function chunkTranscript(lines: TranscriptLine[]): Piece[] {
  const pieces: Piece[] = [];
  for (const line of lines) {
    const last = pieces.at(-1);
    if (last && last.startSeconds !== null && line.startSeconds - last.startSeconds < CHUNK_SECONDS) {
      last.text += " " + line.text;
    } else {
      pieces.push({ text: line.text, startSeconds: line.startSeconds });
    }
  }
  return pieces;
}

// Split plain text into pieces of ~800 characters, without cutting words
function chunkText(text: string): Piece[] {
  const pieces: Piece[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current && current.length + word.length > CHUNK_CHARS) {
      pieces.push({ text: current, startSeconds: null });
      current = "";
    }
    current += (current ? " " : "") + word;
  }
  if (current) pieces.push({ text: current, startSeconds: null });
  return pieces;
}

async function claimNext(): Promise<number | undefined> {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    UPDATE "Content" SET status = 'processing', attempts = attempts + 1
    WHERE id = (
      SELECT id FROM "Content"
      WHERE status = 'pending'
      ORDER BY attempts, id  -- new items before retries
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id`;
  return rows[0]?.id;
}

async function processContent(id: number) {
  const item = await prisma.content.findUnique({ where: { id } });
  if (!item) return; // deleted after it was claimed

  try {
    const info = await getLinkText(item.link);
    // Only replace the title if the user didn't give one (it was saved as the link itself)
    const title = info && item.title === item.link ? info.title : item.title;
    const about = info?.text ?? "";
    const transcript = info?.transcript ?? [];

    // One or more pieces for the title/description, then timestamped pieces of what's said
    const pieces = [...chunkText(`${title}\n${about}`), ...chunkTranscript(transcript)];
    const vectors: number[][] = [];
    for (const piece of pieces) vectors.push(await embed(piece.text));
    // Whole-item vector, used for "similar items"
    const itemVector = await embed(`${title}\n${about}`);
    const fullText = [about, transcript.map((l) => l.text).join(" ")].filter(Boolean).join("\n");

    await prisma.$transaction(async (tx) => {
      await tx.chunk.deleteMany({ where: { contentId: id } });
      for (const [i, piece] of pieces.entries()) {
        await tx.$executeRaw`
          INSERT INTO "Chunk" ("contentId", "index", "text", "startSeconds", "embedding")
          VALUES (${id}, ${i}, ${piece.text}, ${piece.startSeconds}, ${toVector(vectors[i]!)}::vector)`;
      }
      await tx.$executeRaw`
        UPDATE "Content"
        SET title = ${title}, text = ${fullText || null}, embedding = ${toVector(itemVector)}::vector,
            status = 'ready', error = NULL
        WHERE id = ${id}`;
    });
    console.log(`indexed #${id} "${title}": ${pieces.length} chunks`);
  } catch (e) {
    const failed = item.attempts >= MAX_ATTEMPTS;
    console.error(`indexing #${id} failed (attempt ${item.attempts}${failed ? ", giving up" : ""}):`, e);
    // updateMany: doesn't throw if the item was deleted meanwhile
    await prisma.content.updateMany({
      where: { id },
      data: { status: failed ? "failed" : "pending", error: String(e) },
    });
    if (!failed) await sleep(5000 * item.attempts); // back off before retrying
  }
}

export async function startWorker() {
  // A crash mid-job leaves rows stuck in "processing". With one worker it's safe to requeue them.
  await prisma.content.updateMany({ where: { status: "processing" }, data: { status: "pending" } });

  while (true) {
    try {
      const id = await claimNext();
      if (id === undefined) await sleep(IDLE_MS);
      else await processContent(id);
    } catch (e) {
      console.error("worker error:", e); // e.g. database down: wait and keep going
      await sleep(IDLE_MS * 5);
    }
  }
}
