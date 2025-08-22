// src/utils/bibleRef.ts
export type ParsedRef = {
  bookName: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tryParseReference(raw: string): ParsedRef | null {
  const s = norm(raw);
  if (!/\d/.test(s)) return null; // must have at least a chapter number

  const m = s.match(/^(.+?)\s+(\d.*)$/);
  if (!m) return null;

  const bookName = norm(m[1]);
  const rest = m[2];

  const colon = rest.indexOf(":");
  if (colon === -1) {
    const chapter = Number(rest);
    if (!Number.isFinite(chapter)) return null;
    return { bookName, chapter, verseStart: null, verseEnd: null };
  }

  const chapter = Number(rest.slice(0, colon));
  if (!Number.isFinite(chapter)) return null;

  const versePart = rest.slice(colon + 1);
  const dash = versePart.indexOf("-");
  if (dash === -1) {
    const v = Number(versePart);
    if (!Number.isFinite(v)) return null;
    return { bookName, chapter, verseStart: v, verseEnd: v };
  }

  const v1 = Number(versePart.slice(0, dash));
  const v2 = Number(versePart.slice(dash + 1));
  if (!Number.isFinite(v1) || !Number.isFinite(v2)) return null;

  return { bookName, chapter, verseStart: v1, verseEnd: v2 };
}