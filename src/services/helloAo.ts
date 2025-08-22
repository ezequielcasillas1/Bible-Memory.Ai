// src/services/helloAo.ts
// Free Use Bible API (no API keys): https://bible.helloao.org/

export type Translation = { id: string; name: string; language?: string };
export type Book = { id: string; name: string };

const BASE = "https://bible.helloao.org/api";

async function getJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
  return res.json();
}

/** Discover all translations (don't hardcode) */
export async function listTranslations(): Promise<Translation[]> {
  return getJSON<Translation[]>(`${BASE}/available_translations.json`);
}

/** List books for a translation */
export async function listBooks(translationId: string): Promise<Book[]> {
  return getJSON<Book[]>(`${BASE}/${encodeURIComponent(translationId)}/books.json`);
}

/** Fetch a chapter JSON */
export async function fetchChapter(translationId: string, bookId: string, chapter: number) {
  const url = `${BASE}/${encodeURIComponent(translationId)}/${encodeURIComponent(bookId)}/${chapter}.json`;
  return getJSON<any>(url);
}

/** Keyword search within a translation (returns array of hits) */
export async function searchVerses(translationId: string, query: string) {
  const url = `${BASE}/${encodeURIComponent(translationId)}/search.json?q=${encodeURIComponent(query)}`;
  return getJSON<any[]>(url); // shape: [{book, chapter, verse, text, ...}]
}