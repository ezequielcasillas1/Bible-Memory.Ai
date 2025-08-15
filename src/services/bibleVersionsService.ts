import { BibleVersion } from '../types';

const SCRIPTURE_API_BASE = 'https://api.scripture.api.bible/v1';

export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
    
    if (!apiKey) {
      console.warn('VITE_BIBLE_API_KEY not found in environment variables');
      return [];
    }

    const response = await fetch(
      `${SCRIPTURE_API_BASE}/bibles?language=eng&abbreviation=KJV,NKJV,NLT,ESV,ASV&include-full-details=true`,
      {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid API response structure:', data);
      return [];
    }

    return data.data.map((bible: any): BibleVersion => ({
      id: bible.id,
      abbreviation: bible.abbreviation,
      name: bible.name,
      description: bible.description
    }));

  } catch (error) {
    console.error('Failed to fetch Bible versions:', error);
    return [];
  }
}