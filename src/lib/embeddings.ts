// import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

// // The model is downloaded once (~25MB) and cached by the browser.
// // "Xenova/all-MiniLM-L6-v2" is a small, fast embedding model — good
// // balance of quality vs. size for running entirely on-device.
// const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

// let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

// function getExtractor() {
//   if (!extractorPromise) {
//     extractorPromise = pipeline("feature-extraction", MODEL_NAME) as Promise<FeatureExtractionPipeline>;
//   }
//   return extractorPromise;
// }

// /**
//  * Converts a piece of text into an embedding: an array of numbers
//  * that represents its "meaning". Similar meanings -> similar numbers.
//  */
// export async function embedText(text: string): Promise<number[]> {
//   const extractor = await getExtractor();

//   const output = await extractor(text, {
//     pooling: "mean",
//     normalize: true,
//   });

//   // output.data is a typed array (Float32Array) — convert to a plain array
//   // so it can be stored in IndexedDB.
//   return Array.from(output.data as Float32Array);
// }

// /**
//  * Cosine similarity: measures how "close" two embeddings are.
//  * Returns a number from -1 (opposite) to 1 (identical meaning).
//  * Since our embeddings are normalized, this is just a dot product.
//  */
// export function cosineSimilarity(a: number[], b: number[]): number {
//   let dot = 0;
//   for (let i = 0; i < a.length; i++) {
//     dot += a[i] * b[i];
//   }
//   return dot;
// }




import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";

// Force the model to be fetched from Hugging Face's servers instead of
// looking for a local copy (which doesn't exist inside the extension).
env.allowLocalModels = false;

// Chrome extensions block the worker/blob-based multithreading approach
// that onnxruntime-web normally uses (strict CSP). Running it directly
// on the main thread avoids that entirely.
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.numThreads = 1;

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_NAME) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}