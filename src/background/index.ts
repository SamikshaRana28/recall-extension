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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_CURRENT_PAGE" && message.tabId) {
    savePage(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("[Recall] save failed:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }
});

/**
 * Sends a message to the content script, injecting it first if it isn't
 * already running in this tab. This handles the common case where the
 * extension was just installed/reloaded and the tab was already open
 * before that — Chrome doesn't auto-inject into pre-existing tabs.
 */
async function sendMessageWithInjection(
  tabId: number,
  message: unknown
): Promise<any> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Content script isn't there yet — inject it now, then retry.
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/index.ts.js"], // matches the built file name; see note below
    });
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

async function savePage(tabId: number): Promise<void> {
  const extracted = await sendMessageWithInjection(tabId, {
    type: "EXTRACT_PAGE_CONTENT",
  });

  if (!extracted?.content) {
    throw new Error("Could not extract page content — try reloading the tab.");
  }

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
    clickCount: 0,
    important: false,
  };

  await saveMemory(memory);
}