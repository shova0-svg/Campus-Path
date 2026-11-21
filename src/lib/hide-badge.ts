/** Removes the "Edit with Lovable" overlay if the host injects it into our document. */
const BADGE_RE = /edit\s+with/i;
const NAME_RE = /lovable/i;

function scrub(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const matches: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = (node.textContent ?? "").trim();
    if (BADGE_RE.test(value) && NAME_RE.test(value) && value.length < 80) matches.push(node);
  }
  for (const text of matches) {
    let target: HTMLElement | null = text.parentElement;
    if (!target) continue;
    // Walk up to the small pill container, never beyond a plausible badge size.
    for (let i = 0; i < 2; i++) {
      const parent: HTMLElement | null = target.parentElement;
      if (!parent || parent === document.body || parent === document.documentElement) break;
      if ((parent.textContent ?? "").trim().length < 80 && parent.childElementCount <= 2) {
        target = parent;
      } else break;
    }
    const badge: HTMLElement = target;
    badge.style.setProperty("display", "none", "important");
    badge.setAttribute("data-sohoj-hidden-badge", "1");
  }
}

export function hideLovableBadge(): () => void {
  if (typeof document === "undefined") return () => {};
  scrub();
  const observer = new MutationObserver(() => {
    if (typeof document !== "undefined") scrub();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
