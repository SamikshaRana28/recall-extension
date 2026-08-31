// // import { getAllMemories, type Memory } from "../lib/db";
// // import { embedText, cosineSimilarity } from "../lib/embeddings";

// // const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
// // const resultsEl = document.querySelector<HTMLElement>("#results")!;
// // const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!;

// // function renderMemories(memories: Memory[]) {
// //   if (memories.length === 0) {
// //     resultsEl.innerHTML = `<p class="hint">No memories yet. Save a page to get started.</p>`;
// //     return;
// //   }

// //   resultsEl.innerHTML = memories
// //     .map(
// //       (m) => `
// //       <div class="memory-item" data-url="${m.url}">
// //         <div class="title">${escapeHtml(m.title)}</div>
// //         <div class="url">${escapeHtml(m.url)}</div>
// //       </div>`
// //     )
// //     .join("");

// //   resultsEl.querySelectorAll<HTMLElement>(".memory-item").forEach((el) => {
// //     el.addEventListener("click", () => {
// //       const url = el.dataset.url;
// //       if (url) chrome.tabs.create({ url });
// //     });
// //   });
// // }

// // function escapeHtml(str: string) {
// //   const div = document.createElement("div");
// //   div.textContent = str;
// //   return div.innerHTML;
// // }

// // async function loadRecent() {
// //   const memories = await getAllMemories();
// //   memories.sort((a, b) => b.timestamp - a.timestamp);
// //   renderMemories(memories.slice(0, 10));
// // }

// // // Minimum similarity score to count as a "relevant" result.
// // // Tune this if results feel too strict or too loose.
// // const SIMILARITY_THRESHOLD = 0.35;

// // let searchDebounceTimer: number | undefined;

// // searchInput.addEventListener("input", () => {
// //   // Debounce: wait 300ms after the user stops typing before running the
// //   // (relatively expensive) embedding + search. Avoids re-running the AI
// //   // model on every single keystroke.
// //   window.clearTimeout(searchDebounceTimer);
// //   searchDebounceTimer = window.setTimeout(runSearch, 300);
// // });

// // async function runSearch() {
// //   const query = searchInput.value.trim();
// //   const memories = await getAllMemories();

// //   if (!query) {
// //     memories.sort((a, b) => b.timestamp - a.timestamp);
// //     renderMemories(memories.slice(0, 10));
// //     return;
// //   }

// //   resultsEl.innerHTML = `<p class="hint">Searching…</p>`;

// //   const queryEmbedding = await embedText(query);

// //   const scored = memories
// //     .filter((m) => m.embedding) // skip any memory saved before embeddings existed
// //     .map((m) => ({
// //       memory: m,
// //       score: cosineSimilarity(queryEmbedding, m.embedding!),
// //     }))
// //     .filter((s) => s.score >= SIMILARITY_THRESHOLD)
// //     .sort((a, b) => b.score - a.score);

// //   renderMemories(scored.map((s) => s.memory));
// // }

// // saveBtn.addEventListener("click", async () => {
// //   saveBtn.disabled = true;
// //   saveBtn.textContent = "Saving…";

// //   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
// //   if (tab?.id) {
// //     await chrome.runtime.sendMessage({ type: "SAVE_CURRENT_PAGE", tabId: tab.id });
// //   }

// //   saveBtn.textContent = "✅ Saved";
// //   await loadRecent();
// //   setTimeout(() => {
// //     saveBtn.disabled = false;
// //     saveBtn.textContent = "📄 Remember this page";
// //   }, 1200);
// // });

// // loadRecent();


// import { getAllMemories, type Memory } from "../lib/db";
// import { embedText, cosineSimilarity } from "../lib/embeddings";
// import { askRecall } from "../lib/llm";

// const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
// const resultsEl = document.querySelector<HTMLElement>("#results")!;
// const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!;
// const askInput = document.querySelector<HTMLInputElement>("#ask-input")!;
// const askBtn = document.querySelector<HTMLButtonElement>("#ask-btn")!;
// const askAnswerEl = document.querySelector<HTMLElement>("#ask-answer")!;

// function renderMemories(memories: Memory[]) {
//   if (memories.length === 0) {
//     resultsEl.innerHTML = `<p class="hint">No memories yet. Save a page to get started.</p>`;
//     return;
//   }

//   resultsEl.innerHTML = memories
//     .map(
//       (m) => `
//       <div class="memory-item" data-url="${m.url}">
//         <div class="title">${escapeHtml(m.title)}</div>
//         <div class="url">${escapeHtml(m.url)}</div>
//       </div>`
//     )
//     .join("");

//   resultsEl.querySelectorAll<HTMLElement>(".memory-item").forEach((el) => {
//     el.addEventListener("click", () => {
//       const url = el.dataset.url;
//       if (url) chrome.tabs.create({ url });
//     });
//   });
// }

// function escapeHtml(str: string) {
//   const div = document.createElement("div");
//   div.textContent = str;
//   return div.innerHTML;
// }

// async function loadRecent() {
//   const memories = await getAllMemories();
//   memories.sort((a, b) => b.timestamp - a.timestamp);
//   renderMemories(memories.slice(0, 10));
// }

// const SIMILARITY_THRESHOLD = 0.35;
// let searchDebounceTimer: number | undefined;

// searchInput.addEventListener("input", () => {
//   window.clearTimeout(searchDebounceTimer);
//   searchDebounceTimer = window.setTimeout(runSearch, 300);
// });

// async function runSearch() {
//   const query = searchInput.value.trim();
//   const memories = await getAllMemories();

//   if (!query) {
//     memories.sort((a, b) => b.timestamp - a.timestamp);
//     renderMemories(memories.slice(0, 10));
//     return;
//   }

//   resultsEl.innerHTML = `<p class="hint">Searching…</p>`;

//   const queryEmbedding = await embedText(query);

//   const scored = memories
//     .filter((m) => m.embedding)
//     .map((m) => ({
//       memory: m,
//       score: cosineSimilarity(queryEmbedding, m.embedding!),
//     }))
//     .filter((s) => s.score >= SIMILARITY_THRESHOLD)
//     .sort((a, b) => b.score - a.score);

//   renderMemories(scored.map((s) => s.memory));
// }

// saveBtn.addEventListener("click", async () => {
//   saveBtn.disabled = true;
//   saveBtn.textContent = "Saving…";

//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   if (tab?.id) {
//     await chrome.runtime.sendMessage({ type: "SAVE_CURRENT_PAGE", tabId: tab.id });
//   }

//   saveBtn.textContent = "✅ Saved";
//   await loadRecent();
//   setTimeout(() => {
//     saveBtn.disabled = false;
//     saveBtn.textContent = "📄 Remember this page";
//   }, 1200);
// });

// askBtn.addEventListener("click", async () => {
//   const question = askInput.value.trim();
//   if (!question) return;

//   askBtn.disabled = true;
//   askBtn.textContent = "Thinking…";
//   askAnswerEl.textContent = "Loading model (first time may take a minute)…";

//   try {
//     const { answer, usedMemories } = await askRecall(question, (progressText) => {
//       askAnswerEl.textContent = progressText;
//     });

//     const sourcesHtml =
//       usedMemories.length > 0
//         ? `<div class="sources">Sources: ${usedMemories
//             .map((m) => escapeHtml(m.title))
//             .join(", ")}</div>`
//         : "";

//     askAnswerEl.innerHTML = `${escapeHtml(answer)}${sourcesHtml}`;
//   } catch (err) {
//     askAnswerEl.textContent = `Something went wrong: ${String(err)}`;
//     console.error("[Recall] ask failed:", err);
//   } finally {
//     askBtn.disabled = false;
//     askBtn.textContent = "🤖 Ask";
//   }
// });

// loadRecent();



import { getAllMemories, incrementClickCount, toggleImportant, type Memory } from "../lib/db";
import { embedText } from "../lib/embeddings";
import { scoreMemories } from "../lib/scoring";
import { askRecall } from "../lib/llm";

const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const resultsEl = document.querySelector<HTMLElement>("#results")!;
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!;
const askInput = document.querySelector<HTMLInputElement>("#ask-input")!;
const askBtn = document.querySelector<HTMLButtonElement>("#ask-btn")!;
const askAnswerEl = document.querySelector<HTMLElement>("#ask-answer")!;

function renderMemories(memories: Memory[]) {
  if (memories.length === 0) {
    resultsEl.innerHTML = `<p class="hint">No memories yet. Save a page to get started.</p>`;
    return;
  }

  resultsEl.innerHTML = memories
    .map(
      (m) => `
      <div class="memory-item" data-id="${m.id}" data-url="${m.url}">
        <button class="star-btn ${m.important ? "starred" : ""}" data-id="${m.id}" title="Mark important">
          ${m.important ? "⭐" : "☆"}
        </button>
        <div class="memory-text">
          <div class="title">${escapeHtml(m.title)}</div>
          <div class="url">${escapeHtml(m.url)}</div>
        </div>
      </div>`
    )
    .join("");

  // Clicking the card opens the page (and counts as "usage")
  resultsEl.querySelectorAll<HTMLElement>(".memory-item").forEach((el) => {
    el.addEventListener("click", async (e) => {
      // Don't open the page if the click was on the star button
      if ((e.target as HTMLElement).closest(".star-btn")) return;

      const url = el.dataset.url;
      const id = el.dataset.id;
      if (id) await incrementClickCount(id);
      if (url) chrome.tabs.create({ url });
    });
  });

  // Clicking the star toggles "important" without opening the page
  resultsEl.querySelectorAll<HTMLButtonElement>(".star-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!id) return;
      await toggleImportant(id);
      // Re-run whatever is currently showing so the star state refreshes
      if (searchInput.value.trim()) {
        runSearch();
      } else {
        loadRecent();
      }
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

const SCORE_THRESHOLD = 0.25; // combined score, not raw similarity
let searchDebounceTimer: number | undefined;

searchInput.addEventListener("input", () => {
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
  const ranked = scoreMemories(memories, queryEmbedding).filter(
    (s) => s.score >= SCORE_THRESHOLD
  );

  renderMemories(ranked.map((r) => r.memory));
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

askBtn.addEventListener("click", async () => {
  const question = askInput.value.trim();
  if (!question) return;

  askBtn.disabled = true;
  askBtn.textContent = "Thinking…";
  askAnswerEl.textContent = "Loading model (first time may take a minute)…";

  try {
    const { answer, usedMemories } = await askRecall(question, (progressText) => {
      askAnswerEl.textContent = progressText;
    });

    const sourcesHtml =
      usedMemories.length > 0
        ? `<div class="sources">Sources: ${usedMemories
            .map((m) => escapeHtml(m.title))
            .join(", ")}</div>`
        : "";

    askAnswerEl.innerHTML = `${escapeHtml(answer)}${sourcesHtml}`;
  } catch (err) {
    askAnswerEl.textContent = `Something went wrong: ${String(err)}`;
    console.error("[Recall] ask failed:", err);
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "🤖 Ask";
  }
});

loadRecent();