// Turns text into a vector (384 numbers) that captures its meaning, so similar
// content ends up close together. Runs locally: no API key, no cost.
import { pipeline } from "@huggingface/transformers";
import { prisma } from "../lib/prisma.js";

const MODEL = "Xenova/all-MiniLM-L6-v2";

// Load the model once (first run downloads ~25MB, then it's cached on disk)
let extractor: ReturnType<typeof loadModel> | null = null;
function loadModel() {
  return pipeline("feature-extraction", MODEL, { dtype: "q8" });
}

export async function embed(text: string): Promise<number[]> {
  extractor ??= loadModel();
  const model = await extractor;
  // The model only reads the first ~256 tokens, so there's no point sending more
  const output = await model(text.slice(0, 2000), { pooling: "mean", normalize: true });
  return output.tolist()[0] as number[];
}

// pgvector accepts vectors written as "[0.1,0.2,...]"
export function toVector(values: number[]): string {
  return JSON.stringify(values);
}

export async function saveEmbedding(contentId: number, title: string, text: string | null) {
  const vector = await embed(`${title}\n${text ?? ""}`);
  await prisma.$executeRaw`UPDATE "Content" SET embedding = ${toVector(vector)}::vector WHERE id = ${contentId}`;
}
