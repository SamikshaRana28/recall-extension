import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import { getAllMemories } from "./db";
import { embedText, cosineSimilarity } from "./embeddings";

// A small model, chosen to keep download size and load time reasonable
// for a browser extension. Bigger models (Llama-3.2-1B, Phi-3.5-mini)
// give better answers but take much longer to download/load.
const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<MLCEngine> | null = null;

export function getEngine(onProgress?: (text: string) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress?.(report.text);
      },
    });
  }
  return enginePromise;
}

const TOP_K = 4; // how many saved memories to feed as context

/**
 * The full RAG pipeline:
 * 1. Embed the user's question
 * 2. Retrieve the most similar saved memories (semantic search)
 * 3. Build a prompt containing only those memories as context
 * 4. Ask the local LLM to answer using that context
 */
export async function askRecall(
  question: string,
  onProgress?: (text: string) => void
): Promise<{ answer: string; usedMemories: { title: string; url: string }[] }> {
  const memories = await getAllMemories();
  const withEmbeddings = memories.filter((m) => m.embedding);

  if (withEmbeddings.length === 0) {
    return {
      answer: "You don't have any saved memories yet — save a page first, then ask me about it.",
      usedMemories: [],
    };
  }

  const questionEmbedding = await embedText(question);

  const ranked = withEmbeddings
    .map((m) => ({
      memory: m,
      score: cosineSimilarity(questionEmbedding, m.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const context = ranked
    .map(
      (r, i) =>
        `[Memory ${i + 1}] Title: ${r.memory.title}\nURL: ${r.memory.url}\nContent: ${r.memory.content.slice(0, 1200)}`
    )
    .join("\n\n");

  const prompt = `You are Recall, a private assistant that answers questions using ONLY the user's saved browsing memories below. If the memories don't contain the answer, say so honestly — do not make things up.

${context}

Question: ${question}

Answer concisely, and mention which memory/memories you used.`;

  const engine = await getEngine(onProgress);

  const reply = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const answer = reply.choices[0]?.message?.content ?? "(no response generated)";

  return {
    answer,
    usedMemories: ranked.map((r) => ({ title: r.memory.title, url: r.memory.url })),
  };
}