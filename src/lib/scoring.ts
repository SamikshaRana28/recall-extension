import type { Memory } from "./db";
import { cosineSimilarity } from "./embeddings";

export interface ScoredMemory {
  memory: Memory;
  score: number;
  breakdown: {
    similarity: number;
    recency: number;
    importance: number;
    usage: number;
  };
}

const WEIGHTS = {
  similarity: 0.6,
  recency: 0.2,
  importance: 0.1,
  usage: 0.1,
};

// Converts "how long ago" into a 0–1 freshness score.
// A memory saved right now scores ~1, one saved 30+ days ago scores ~0.
function recencyScore(timestamp: number): number {
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  const HALF_LIFE_DAYS = 14; // score halves roughly every 14 days
  return Math.pow(0.5, ageInDays / HALF_LIFE_DAYS);
}

// Squashes click counts into a 0–1 range without letting a handful of
// heavily-clicked memories dominate everything (diminishing returns).
function usageScore(clickCount: number): number {
  const MAX_MEANINGFUL_CLICKS = 10;
  return Math.min(clickCount / MAX_MEANINGFUL_CLICKS, 1);
}

/**
 * Combines semantic similarity with recency, user-marked importance,
 * and past usage into a single ranking score. This is what turns
 * "most similar vector" into "most useful memory for this user".
 */
export function scoreMemories(
  memories: Memory[],
  queryEmbedding: number[]
): ScoredMemory[] {
  return memories
    .filter((m) => m.embedding)
    .map((m) => {
      const similarity = cosineSimilarity(queryEmbedding, m.embedding!);
      const recency = recencyScore(m.timestamp);
      const importance = m.important ? 1 : 0;
      const usage = usageScore(m.clickCount);

      const score =
        WEIGHTS.similarity * similarity +
        WEIGHTS.recency * recency +
        WEIGHTS.importance * importance +
        WEIGHTS.usage * usage;

      return { memory: m, score, breakdown: { similarity, recency, importance, usage } };
    })
    .sort((a, b) => b.score - a.score);
}