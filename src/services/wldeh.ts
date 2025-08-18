// src/services/wldeh.ts
import { tryParseReference } from "../utils/bibleRef";
import { renderChapterToHTML, renderVerseToHTML } from "../utils/renderBible";

export const WldehVersions = [
  "en-kjv", "en-asv", "en-webus", "en-ylt", "en-darby", "en-drb",
] as const;

export type WldehVersion = typeof WldehVersions[number];

const CDN = "https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles";

async function getJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
  return res.json();
}

/**
 * Fetch by human reference ("psalms 23", "john 3:16", "john 3:16-18")
 * Returns { html, reference }
 */
export async function fetchPassageHTML(version: WldehVersion, humanRef: string) {
  const parsed = tryParseReference(humanRef);
  if (!parsed) {
    // Not a reference → signal to caller (they can run keyword search or show "no results")
    return { html: "", reference: "", isReference: false };
  }

  const { bookSlug, chapter, verseStart, verseEnd } = parsed;

  // WHOLE CHAPTER
  if (verseStart == null) {
    const url = `${CDN}/${version}/books/${bookSlug}/chapters/${chapter}.json`;
    const ch = await getJSON(url);
    const html = renderChapterToHTML(ch);
    return { html, reference: humanRef, isReference: true };
  }

  // SINGLE VERSE
  if (verseStart === verseEnd) {
    const url = `${CDN}/${version}/books/${bookSlug}/chapters/${chapter}/verses/${verseStart}.json`;
    const v = await getJSON(url);
    const html = renderVerseToHTML(v);
    return { html, reference: humanRef, isReference: true };
  }

  // RANGE IN SAME CHAPTER
  const url = `${CDN}/${version}/books/${bookSlug}/chapters/${chapter}.json`;
  const ch = await getJSON(url);
  // ch is a map or array
  const arr: string[] = [];
  const isArray = Array.isArray(ch);
  for (let v = verseStart; v <= (verseEnd ?? verseStart); v++) {
    const text = isArray ? ch[v - 1] : ch[String(v)];
    if (!text) break;
    arr.push(renderVerseToHTML({ verse: v, text }));
  }
  return { html: arr.join(" "), reference: humanRef, isReference: true };
}