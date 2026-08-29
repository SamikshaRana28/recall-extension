import { saveMemory, makeId, type Memory } from "../lib/db";

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

  // NOTE: Phase 3 will run this content through a privacy filter
  // (strip emails/phones/tokens) before it ever gets embedded or stored.
  // Phase 2 will attach a real embedding here via Transformers.js.
  const memory: Memory = {
    id: makeId(),
    title: extracted.title,
    url: extracted.url,
    content: extracted.content,
    tags: [],
    timestamp: Date.now(),
  };

  await saveMemory(memory);
}