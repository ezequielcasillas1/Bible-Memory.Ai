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

  const url = abbrevs.length > 0 
    ? `${API}/bibles?language=eng&abbreviation=${encodeURIComponent(abbrevs.join(','))}&include-full-details=true`
    : `${API}/bibles?language=eng&include-full-details=true`;
  const res = await fetch(url, {
    headers: { 'accept': 'application/json', 'api-key': key }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API.Bible error ${res.status}: ${text}`);
    // Return fallback data instead of throwing
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