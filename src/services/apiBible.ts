import type { } from 'react';

export type ApiBibleSummary = {
  id: string;
  abbreviation: string;
  name: string;
  language: { id: string; name: string };
};

const API = 'https://api.scripture.api.bible/v1';

export async function fetchEnglishBiblesByAbbrev(abbrevs: string[]): Promise<ApiBibleSummary[]> {
  const key = import.meta.env.VITE_API_BIBLE_KEY;
  if (!key) throw new Error('Missing VITE_API_BIBLE_KEY');

  const url = abbrevs.length > 0 
    ? `${API}/bibles?language=eng&abbreviation=${encodeURIComponent(abbrevs.join(','))}&include-full-details=true`
    : `${API}/bibles?language=eng&include-full-details=true`;
  const res = await fetch(url, {
    headers: { 'accept': 'application/json', 'api-key': key }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API.Bible error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const list = (json?.data ?? []) as any[];
  return list.map(b => ({
    id: b.id,
    abbreviation: (b.abbreviation || '').toUpperCase(),
    name: b.name || b.abbreviation,
    language: { id: b.language?.id, name: b.language?.name }
  }));
}

export async function searchPassageByQuery(bibleId: string, query: string): Promise<{ text: string; html?: string }> {
  const key = import.meta.env.VITE_API_BIBLE_KEY;
  if (!key) throw new Error('Missing VITE_API_BIBLE_KEY');
  const url = `${API}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'accept': 'application/json', 'api-key': key } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API.Bible search error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const first = data?.data?.verses?.[0];
  const text = (first?.text ?? '').toString().trim();
  return { text };
}