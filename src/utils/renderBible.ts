// src/utils/renderBible.ts
function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type ChapterMap = Record<string, string> | string[];

export function renderChapterToHTML(ch: ChapterMap): string {
  const pairs: Array<[string, string]> = Array.isArray(ch)
    ? ch.map((t, i) => [String(i + 1), t])
    : Object.entries(ch);

  return pairs
    .map(([v, t]) => `<span class="verse"><sup>${esc(v)}</sup> ${esc(String(t))}</span>`)
    .join(" ");
}

export function renderVerseToHTML(obj: any): string {
  const v = String(obj?.verse ?? obj?.v ?? "");
  const t = String(obj?.text ?? obj?.t ?? "");
  return `<span class="verse"><sup>${esc(v)}</sup> ${esc(t)}</span>`;
}

// Legacy functions for backward compatibility
export function renderChapterToPlain(ch: ChapterMap): string {
  const pairs: Array<[string, string]> = Array.isArray(ch)
    ? ch.map((t, i) => [String(i + 1), t])
    : Object.entries(ch);

  return pairs.map(([v, t]) => `${v} ${t}`).join(" ");
}

function escapeHtml(s: string) {
  return esc(s);
}

export { escapeHtml };