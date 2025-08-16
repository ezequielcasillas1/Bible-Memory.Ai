function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type ChapterLike = Record<string, string> | string[];

export function renderChapterToPlain(ch: ChapterLike): string {
  const entries = Array.isArray(ch)
    ? ch.map((t, i) => [String(i + 1), t] as const)
    : Object.entries(ch);

  return entries.map(([v, t]) => `${v} ${t}`).join(" ");
}

export function renderChapterToHtml(ch: ChapterLike): string {
  const entries = Array.isArray(ch)
    ? ch.map((t, i) => [String(i + 1), t] as const)
    : Object.entries(ch);

  return entries
    .map(([v, t]) => `<span class="verse"><sup>${v}</sup> ${escapeHtml(t)}</span>`)
    .join(" ");
}

export function renderVerseToHtml(verseObj: any): string {
  const vnum = String(verseObj?.verse ?? verseObj?.v ?? "");
  const text = String(verseObj?.text ?? verseObj?.t ?? "");
  return `<span class="verse"><sup>${vnum}</sup> ${escapeHtml(text)}</span>`;
}