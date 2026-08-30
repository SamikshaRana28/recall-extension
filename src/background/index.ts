// import { saveMemory, makeId, type Memory } from "../lib/db";
// import { embedText } from "../lib/embeddings";

// const CONTEXT_MENU_ID = "recall-remember-page";

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: CONTEXT_MENU_ID,
//     title: "Remember this page (Recall)",
//     contexts: ["page"],
//   });
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
//     savePage(tab.id).catch((err) => console.error("[Recall] save failed:", err));
//   }
// });

// // Popup asks us to save the active tab
// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message?.type === "SAVE_CURRENT_PAGE" && message.tabId) {
//     savePage(message.tabId)
//       .then(() => sendResponse({ ok: true }))
//       .catch((err) => {
//         console.error("[Recall] save failed:", err);
//         sendResponse({ ok: false, error: String(err) });
//       });
//     return true; // keep the message channel open for the async response
//   }
// });

// async function savePage(tabId: number): Promise<void> {
//   const extracted = await chrome.tabs.sendMessage(tabId, {
//     type: "EXTRACT_PAGE_CONTENT",
//   });

//   if (!extracted?.content) {
//     throw new Error("Could not extract page content — try reloading the tab.");
//   }

//   // NOTE: Phase 3 will run this content through a privacy filter
//   // (strip emails/phones/tokens) before it ever gets embedded or stored.

//   // Generate the embedding right here, before saving. This is the
//   // AI step: the page's text gets converted into a 384-number vector
//   // that captures its meaning — entirely inside the browser.
//   const embedding = await embedText(
//     `${extracted.title}\n\n${extracted.content}`
//   );

//   const memory: Memory = {
//     id: makeId(),
//     title: extracted.title,
//     url: extracted.url,
//     content: extracted.content,
//     tags: [],
//     timestamp: Date.now(),
//     embedding,
//   };

//   await saveMemory(memory);
// }

import { saveMemory, makeId, type Memory } from "../lib/db";
import { embedText } from "../lib/embeddings";
import { filterSensitiveContent } from "../lib/privacy";

const CONTEXT_MENU_ID = "recall-remember-page";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Remember this page (Recall)",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    savePage(tab.id).catch((err) => console.error("[Recall] save failed:", err));
  }
});

// Popup asks us to save the active tab
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_CURRENT_PAGE" && message.tabId) {
    savePage(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("[Recall] save failed:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // keep the message channel open for the async response
  }
});

async function savePage(tabId: number): Promise<void> {
  const extracted = await chrome.tabs.sendMessage(tabId, {
    type: "EXTRACT_PAGE_CONTENT",
  });

  if (!extracted?.content) {
    throw new Error("Could not extract page content — try reloading the tab.");
  }

  // Privacy step: strip obvious sensitive info BEFORE it ever gets
  // embedded or stored. This runs first, so nothing downstream ever
  // sees the raw sensitive text.
  const { cleaned, redactionCounts } = filterSensitiveContent(extracted.content);
  if (Object.keys(redactionCounts).length > 0) {
    console.log("[Recall] redacted sensitive content:", redactionCounts);
  }

  const embedding = await embedText(`${extracted.title}\n\n${cleaned}`);

  const memory: Memory = {
    id: makeId(),
    title: extracted.title,
    url: extracted.url,
    content: cleaned,
    tags: [],
    timestamp: Date.now(),
    embedding,
  };

  await saveMemory(memory);
}