chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXTRACT_PAGE_CONTENT") {
    sendResponse({
      title: document.title,
      url: location.href,
      content: extractReadableText(),
    });
  }
  // Synchronous response — no `return true` needed here.
});

function extractReadableText(): string {
  // Naive first pass: grab visible body text, strip script/style/nav noise,
  // and cap the length. Good enough for Phase 1 — a real readability
  // extraction (Mozilla Readability.js) is a natural Phase 2 upgrade.
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, nav, footer, noscript, svg")
    .forEach((el) => el.remove());

  const text = clone.innerText.replace(/\s+/g, " ").trim();
  const MAX_CHARS = 8000;
  return text.slice(0, MAX_CHARS);
}