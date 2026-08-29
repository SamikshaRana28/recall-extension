import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Memory {
  id: string;
  title: string;
  url: string;
  content: string; // cleaned page text (post privacy-filter, Phase 3)
  notes?: string;
  tags: string[];
  timestamp: number;
  embedding?: number[]; // filled in Phase 2 (Transformers.js)
}

interface RecallDB extends DBSchema {
  memories: {
    key: string;
    value: Memory;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "recall-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RecallDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<RecallDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("memories", { keyPath: "id" });
        store.createIndex("by-timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

export async function saveMemory(memory: Memory): Promise<void> {
  const db = await getDb();
  await db.put("memories", memory);
}

export async function getAllMemories(): Promise<Memory[]> {
  const db = await getDb();
  return db.getAll("memories");
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("memories", id);
}

export function makeId(): string {
  return crypto.randomUUID();
}