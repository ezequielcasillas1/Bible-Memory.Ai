// src/utils/renderBible.ts
function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Accepts chapter data as array [{verse,text}] or map {"1":"..."} and returns HTML */
export function renderChapterToHTML(chapterData: any): string {
  if (Array.isArray(chapterData)) {
    return chapterData
      .map((v: any) => {
        const n = v?.verse ?? v?.v ?? "";
        const t = v?.text ?? v?.t ?? "";
        return `<span class="verse"><sup>${esc(String(n))}</sup> ${esc(String(t))}</span>`;
      })
      .join(" ");
  }
  if (chapterData && typeof chapterData === "object") {
    return Object.entries(chapterData)
      .map(([n, t]) => `<span class="verse"><sup>${esc(String(n))}</sup> ${esc(String(t as string))}</span>`)
      .join(" ");
  }
  return esc(String(chapterData ?? ""));
}

export function renderRangeToHTML(chapterData: any, start: number, end: number): string {
  const out: string[] = [];
  const get = (v: number): string | null => {
    if (Array.isArray(chapterData)) {
      const item = chapterData[v - 1];
      const t = item?.text ?? item?.t;
      return t ? String(t) : null;
    }
    if (chapterData && typeof chapterData === "object") {
      const t = chapterData[String(v)];
      return t ? String(t) : null;
    }
    return null;
  };
  for (let v = start; v <= end; v++) {
    const t = get(v);
    if (!t) break;
    out.push(`<span class="verse"><sup>${v}</sup> ${esc(t)}</span>`);
  }
  return out.join(" ");
}