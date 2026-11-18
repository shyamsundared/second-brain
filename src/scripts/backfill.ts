// Fills in missing data for content saved before a feature existed:
//   1. fetches tweet/YouTube text for rows without text
//   2. creates embeddings for rows without one
// Run with: npm run backfill
import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { getLinkText } from "../ingest/linkText.js";
import { saveEmbedding } from "../ingest/embed.js";

const missingText = await prisma.content.findMany({ where: { text: null } });
for (const c of missingText) {
  const info = await getLinkText(c.link);
  if (!info) continue;
  await prisma.content.update({
    where: { id: c.id },
    // Replace the title only if it was just the link (nothing better was known when saved)
    data: { text: info.text, title: c.title === c.link ? info.title : c.title },
  });
  console.log(`text:      #${c.id} ${info.title}`);
}

const missingEmbedding = await prisma.$queryRaw<{ id: number; title: string; text: string | null }[]>`
  SELECT id, title, text FROM "Content" WHERE embedding IS NULL`;
for (const c of missingEmbedding) {
  await saveEmbedding(c.id, c.title, c.text);
  console.log(`embedding: #${c.id} ${c.title}`);
}

console.log(`Done: ${missingText.length} checked for text, ${missingEmbedding.length} embedded.`);
await prisma.$disconnect();
