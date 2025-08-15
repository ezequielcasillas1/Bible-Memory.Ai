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
  if (!key) {
    console.warn('API.Bible key not found, using fallback data');
    return [
      { id: 'kjv', abbreviation: 'KJV', name: 'King James Version', language: { id: 'eng', name: 'English' } },
      { id: 'nkjv', abbreviation: 'NKJV', name: 'New King James Version', language: { id: 'eng', name: 'English' } },
      { id: 'nlt', abbreviation: 'NLT', name: 'New Living Translation', language: { id: 'eng', name: 'English' } },
      { id: 'esv', abbreviation: 'ESV', name: 'English Standard Version', language: { id: 'eng', name: 'English' } },
      { id: 'asv', abbreviation: 'ASV', name: 'American Standard Version', language: { id: 'eng', name: 'English' } }
    ];
  }

  if (abbrevs.length === 0) {
    const url = `${API}/bibles?language=eng&include-full-details=true`;
    const res = await fetch(url, {
      headers: { 'accept': 'application/json', 'api-key': key }
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`API.Bible error ${res.status}: ${text}`);
      return [
        { id: 'kjv', abbreviation: 'KJV', name: 'King James Version', language: { id: 'eng', name: 'English' } },
        { id: 'nkjv', abbreviation: 'NKJV', name: 'New King James Version', language: { id: 'eng', name: 'English' } },
        { id: 'nlt', abbreviation: 'NLT', name: 'New Living Translation', language: { id: 'eng', name: 'English' } },
        { id: 'esv', abbreviation: 'ESV', name: 'English Standard Version', language: { id: 'eng', name: 'English' } },
        { id: 'asv', abbreviation: 'ASV', name: 'American Standard Version', language: { id: 'eng', name: 'English' } }
      ];
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

  // Make individual requests for each abbreviation
  const results: ApiBibleSummary[] = [];
  for (const abbrev of abbrevs) {
    const url = `${API}/bibles?language=eng&abbreviation=${encodeURIComponent(abbrev)}&include-full-details=true`;
    const res = await fetch(url, {
      headers: { 'accept': 'application/json', 'api-key': key }
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`API.Bible error ${res.status} for ${abbrev}: ${text}`);
      continue; // Skip this abbreviation and continue with others
    }
    const json = await res.json();
    const list = (json?.data ?? []) as any[];
    const mapped = list.map(b => ({
      id: b.id,
      abbreviation: (b.abbreviation || '').toUpperCase(),
      name: b.name || b.abbreviation,
      language: { id: b.language?.id, name: b.language?.name }
    }));
    results.push(...mapped);
  }

  // If no results were found, return fallback data
  if (results.length === 0) {
    return [
      { id: 'kjv', abbreviation: 'KJV', name: 'King James Version', language: { id: 'eng', name: 'English' } },
      { id: 'nkjv', abbreviation: 'NKJV', name: 'New King James Version', language: { id: 'eng', name: 'English' } },
      { id: 'nlt', abbreviation: 'NLT', name: 'New Living Translation', language: { id: 'eng', name: 'English' } },
      { id: 'esv', abbreviation: 'ESV', name: 'English Standard Version', language: { id: 'eng', name: 'English' } },
      { id: 'asv', abbreviation: 'ASV', name: 'American Standard Version', language: { id: 'eng', name: 'English' } }
    ];
  }

  return results;
}

export async function searchPassageByQuery(bibleId: string, query: string): Promise<{ text: string; html?: string }> {
  const key = import.meta.env.VITE_API_BIBLE_KEY;
  if (!key) {
    console.warn('API.Bible key not found, returning sample verse');
    return { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." };
  }
  const url = `${API}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'accept': 'application/json', 'api-key': key } });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API.Bible search error ${res.status}: ${text}`);
    return { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." };
  }
  const data = await res.json();
  const first = data?.data?.verses?.[0];
  const text = (first?.text ?? '').toString().trim();
  return { text };
}