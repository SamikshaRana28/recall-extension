import { getAllMemories, type Memory } from "../lib/db";
import { embedText, cosineSimilarity } from "../lib/embeddings";

const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const resultsEl = document.querySelector<HTMLElement>("#results")!;
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!;

function renderMemories(memories: Memory[]) {
  if (memories.length === 0) {
    resultsEl.innerHTML = `<p class="hint">No memories yet. Save a page to get started.</p>`;
    return;
  }

  resultsEl.innerHTML = memories
    .map(
      (m) => `
      <div class="memory-item" data-url="${m.url}">
        <div class="title">${escapeHtml(m.title)}</div>
        <div class="url">${escapeHtml(m.url)}</div>
      </div>`
    )
    .join("");

  resultsEl.querySelectorAll<HTMLElement>(".memory-item").forEach((el) => {
    el.addEventListener("click", () => {
      const url = el.dataset.url;
      if (url) chrome.tabs.create({ url });
    });
  });
}

function escapeHtml(str: string) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadRecent() {
  const memories = await getAllMemories();
  memories.sort((a, b) => b.timestamp - a.timestamp);
  renderMemories(memories.slice(0, 10));
}

// Minimum similarity score to count as a "relevant" result.
// Tune this if results feel too strict or too loose.
const SIMILARITY_THRESHOLD = 0.35;

let searchDebounceTimer: number | undefined;

searchInput.addEventListener("input", () => {
  // Debounce: wait 300ms after the user stops typing before running the
  // (relatively expensive) embedding + search. Avoids re-running the AI
  // model on every single keystroke.
  window.clearTimeout(searchDebounceTimer);
  searchDebounceTimer = window.setTimeout(runSearch, 300);
});

async function runSearch() {
  const query = searchInput.value.trim();
  const memories = await getAllMemories();

  if (!query) {
    memories.sort((a, b) => b.timestamp - a.timestamp);
    renderMemories(memories.slice(0, 10));
    return;
  }

  resultsEl.innerHTML = `<p class="hint">Searching…</p>`;

  const queryEmbedding = await embedText(query);

  const scored = memories
    .filter((m) => m.embedding) // skip any memory saved before embeddings existed
    .map((m) => ({
      memory: m,
      score: cosineSimilarity(queryEmbedding, m.embedding!),
    }))
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  renderMemories(scored.map((s) => s.memory));
}

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.runtime.sendMessage({ type: "SAVE_CURRENT_PAGE", tabId: tab.id });
  }

  saveBtn.textContent = "✅ Saved";
  await loadRecent();
  setTimeout(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "📄 Remember this page";
  }, 1200);
});

loadRecent();