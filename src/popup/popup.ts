import { getAllMemories, type Memory } from "../lib/db";

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
  // Most recent first. Real semantic ranking lands in Phase 2.
  memories.sort((a, b) => b.timestamp - a.timestamp);
  renderMemories(memories.slice(0, 10));
}

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim().toLowerCase();
  const memories = await getAllMemories();

  if (!query) {
    memories.sort((a, b) => b.timestamp - a.timestamp);
    renderMemories(memories.slice(0, 10));
    return;
  }

  // TEMP: naive substring match. Gets replaced by embedding
  // similarity search once Transformers.js lands in Phase 2.
  const filtered = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
  );
  renderMemories(filtered);
});

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