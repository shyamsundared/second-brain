// "Ask your brain": answer a question from the user's own saved items, with citations.
// 1. Find the chunks closest in meaning to the question (same embeddings as search).
// 2. Send them to Claude as documents, one per saved item, one text block per chunk.
// 3. Claude cites the blocks it used; each block maps back to an item (and a video timestamp).
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./lib/prisma.js";
import { embed, toVector } from "./ingest/embed.js";

const MODEL = "claude-opus-5-5";
const MAX_CHUNKS = 12;
// Lower than search's 0.35: a question is phrased differently from the text that answers it,
// and Claude is told to ignore chunks that don't help, so it's fine to send a few extra.
const MIN_SIMILARITY = 0.3;

const SYSTEM_PROMPT = `You answer questions using only the user's saved items (videos, tweets, articles), provided as documents.
Cite the parts of the documents you use.
If the documents don't contain the answer, say so in one sentence. Don't guess or use outside knowledge.
Keep answers short: a few sentences or a short list.`;

export interface Source {
  contentId: number;
  title: string;
  link: string;
  startSeconds: number | null; // where in the video the cited part starts
  quote: string;
}

export interface Answer {
  // The answer in pieces; each piece lists the sources it's based on
  parts: { text: string; sources: Source[] }[];
}

interface ChunkRow {
  contentId: number;
  title: string;
  link: string;
  text: string;
  startSeconds: number | null;
}

// Created on first use, so the server still starts without ANTHROPIC_API_KEY (only Ask needs it)
let client: Anthropic | null = null;

export async function askBrain(userId: number, question: string): Promise<Answer> {
  const vector = toVector(await embed(question));
  const chunks = await prisma.$queryRaw<ChunkRow[]>`
    SELECT ch."contentId", c.title, c.link, ch.text, ch."startSeconds"
    FROM "Chunk" ch JOIN "Content" c ON c.id = ch."contentId"
    WHERE c."userId" = ${userId}
      AND ch.embedding IS NOT NULL
      AND 1 - (ch.embedding <=> ${vector}::vector) > ${MIN_SIMILARITY}
    ORDER BY ch.embedding <=> ${vector}::vector
    LIMIT ${MAX_CHUNKS}`;

  // Nothing related saved: no need to pay for a model call
  if (chunks.length === 0) {
    return { parts: [{ text: "I couldn't find anything about that in your saved items.", sources: [] }] };
  }

  // One document per saved item, its chunks in video/reading order
  const items = new Map<number, ChunkRow[]>();
  for (const chunk of chunks) items.set(chunk.contentId, [...(items.get(chunk.contentId) ?? []), chunk]);
  const documents = [...items.values()].map((itemChunks) =>
    itemChunks.sort((a, b) => (a.startSeconds ?? -1) - (b.startSeconds ?? -1)),
  );

  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium" },
    // If the model declines (safety classifiers can misfire on harmless text), retry on a fallback model
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        ...documents.map((docChunks) => ({
          type: "document" as const,
          title: docChunks[0]!.title,
          context: docChunks[0]!.link,
          source: {
            type: "content" as const,
            content: docChunks.map((ch) => ({ type: "text" as const, text: ch.text })),
          },
          citations: { enabled: true },
        })),
        { type: "text" as const, text: question },
      ],
    }],
  });

  if (response.stop_reason === "refusal") {
    return { parts: [{ text: "I can't answer that one.", sources: [] }] };
  }

  const parts = response.content.flatMap((block) => {
    if (block.type !== "text") return []; // skip thinking blocks
    const sources = (block.citations ?? []).flatMap((citation): Source[] => {
      if (citation.type !== "content_block_location") return [];
      const chunk = documents[citation.document_index]?.[citation.start_block_index];
      if (!chunk) return [];
      return [{
        contentId: chunk.contentId,
        title: chunk.title,
        link: chunk.link,
        startSeconds: chunk.startSeconds,
        quote: citation.cited_text.slice(0, 300),
      }];
    });
    return [{ text: block.text, sources }];
  });
  return { parts };
}
