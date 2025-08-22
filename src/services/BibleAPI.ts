// Enhanced Bible API implementation supporting multiple sources
import { listTranslations as getHelloAoTranslations, Translation as HelloAoTranslation } from './helloAo';
import { getPassageHTML, generateRandomByTopic } from './BibleHelloAo';

export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
  source: 'bible-api' | 'wldeh-api' | 'helloao-api';
  license?: string;
  licenseUrl?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const WLDEH_API_BASE = "https://cdn.jsdelivr.net/gh/wldeh/bible-api";

/** Fetch all available Bible versions from multiple sources */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from multiple sources');
    
    // Start with the original two versions from bible-api.com
    const originalVersions: BibleVersion[] = [
      { 
        id: 'kjv', 
        abbreviation: 'KJV', 
        name: 'King James Version', 
        description: 'The classic 1769 King James Version',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      },
      { 
        id: 'asv', 
        abbreviation: 'ASV', 
        name: 'American Standard Version', 
        description: 'The 1901 American Standard Version',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      }
    ];

    // Fetch versions from HelloAO API
    let helloAoVersions: BibleVersion[] = [];
    try {
      const helloAoTranslations = await getHelloAoTranslations();
      helloAoVersions = helloAoTranslations.map((translation: HelloAoTranslation) => ({
        id: `helloao_${translation.id}`,
        abbreviation: translation.id.toUpperCase(),
        name: translation.name,
        description: `${translation.name} - Free public domain translation`,
        available: true,
        source: 'helloao-api' as const,
        license: 'Public Domain',
        language: translation.language
      }));
      console.log('Loaded HelloAO versions:', helloAoVersions.length);
    } catch (error) {
      console.warn('Failed to load HelloAO API versions:', error);
    }

    // Fetch versions from wldeh API
    let wldehVersions: BibleVersion[] = [];
    try {
      const response = await fetch(`${WLDEH_API_BASE}/bibles/bibles.json`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter for public domain versions and popular translations
        wldehVersions = Object.entries(data)
          .map(([id, versionData]: [string, any]) => ({
            id: `wldeh_${id}`,
            abbreviation: versionData.abbreviation || id.toUpperCase(),
            name: versionData.name || versionData.abbreviation || id,
            description: versionData.description || `${versionData.name || id} translation`,
            available: versionData.license === 'Public Domain' || versionData.license === 'public domain',
            source: 'wldeh-api' as const,
            license: versionData.license,
            licenseUrl: versionData.licenseUrl
          }))
          .filter((version: BibleVersion) => 
            // Only include public domain versions and exclude duplicates of KJV/ASV
            version.available && 
            !['kjv', 'asv'].includes(version.id.replace('wldeh_', '').toLowerCase())
          )
          .slice(0, 15); // Limit to prevent overwhelming the UI
      }
    } catch (error) {
      console.warn('Failed to load wldeh API versions:', error);
    }

    // Add coming soon versions
    const comingSoonVersions: BibleVersion[] = [
      { 
        id: 'nkjv', 
        abbreviation: 'NKJV', 
        name: 'New King James Version', 
        description: 'Coming Soon - Modern language with traditional style',
        available: false,
        source: 'bible-api'
      },
      { 
        id: 'nlt', 
        abbreviation: 'NLT', 
        name: 'New Living Translation', 
        description: 'Coming Soon - Clear, contemporary English',
        available: false,
        source: 'bible-api'
      },
      { 
        id: 'esv', 
        abbreviation: 'ESV', 
        name: 'English Standard Version', 
        description: 'Coming Soon - Literal yet readable translation',
        available: false,
        source: 'bible-api'
      },
      { 
        id: 'niv', 
        abbreviation: 'NIV', 
        name: 'New International Version', 
        description: 'Coming Soon - Popular modern translation',
        available: false,
        source: 'bible-api'
      }
    ];
    
    const allVersions = [...originalVersions, ...helloAoVersions, ...wldehVersions, ...comingSoonVersions];
    console.log('Loaded Bible versions:', allVersions);
    return allVersions;
  } catch (error) {
    console.error("Failed to load Bible versions:", error);
    throw error;
  }
}

/** Helper: fetch a passage by Bible version and reference */
export async function getPassageByReference(versionId: string, reference: string): Promise<any> {
  try {
    console.log(`Fetching passage: ${reference} in ${versionId}`);
    
    // Handle HelloAO API versions
    if (versionId.startsWith('helloao_')) {
      const actualVersionId = versionId.replace('helloao_', '');
      return await getHelloAoPassage(actualVersionId, reference);
    }
    
    // Handle wldeh API versions
    if (versionId.startsWith('wldeh_')) {
      const actualVersionId = versionId.replace('wldeh_', '');
      return await getWldehPassage(actualVersionId, reference);
    }
    
    // Handle original bible-api.com versions (KJV, ASV) - now secured through our API
    if (versionId !== 'kjv' && versionId !== 'asv') {
      throw new Error(`Version ${versionId} is not yet available. Please select an available version.`);
    }
    
    // Use our secured Bible API endpoint
    const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        reference,
        version: versionId,
        action: 'getPassage'
      }),
    });
    
    if (!response.ok) {
      console.error("Bible API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch passage: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    return data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    throw error;
  }
}

/** Fetch passage from HelloAO API */
async function getHelloAoPassage(versionId: string, reference: string): Promise<any> {
  try {
    const result = await getPassageHTML(versionId, reference);
    
    if (!result.ok) {
      throw new Error(`HelloAO API error: ${result.reason}`);
    }
    
    // Extract plain text from HTML for compatibility
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Transform to match bible-api.com format
    return {
      reference: result.reference,
      text: plainText.trim(),
      translation_id: result.translationId,
      translation_name: versionId.toUpperCase(),
      translation_note: `Fetched from HelloAO API`
    };
  } catch (error) {
    console.error('HelloAO API error:', error);
    throw error;
  }
}

/** Fetch passage from wldeh API */
async function getWldehPassage(versionId: string, reference: string): Promise<any> {
  try {
    // Parse reference to get book, chapter, verse
    const { book, chapter, verse } = parseReference(reference);
    
    // Construct URL for wldeh API
    const url = `${WLDEH_API_BASE}/bibles/${versionId}/${book}/${chapter}/${verse}.json`;
    
    console.log('Wldeh API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from wldeh API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to match bible-api.com format
    return {
      reference: `${book} ${chapter}:${verse}`,
      text: data.text || data.verse || '',
      translation_id: versionId,
      translation_name: versionId.toUpperCase(),
      translation_note: data.translation_note || ''
    };
  } catch (error) {
    console.error('Wldeh API error:', error);
    throw error;
  }
}

/** Parse Bible reference into components */
function parseReference(reference: string): { book: string, chapter: number, verse: number } {
  // Handle various reference formats
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-\d+)?$/);
  
  if (!match) {
    throw new Error(`Invalid reference format: ${reference}`);
  }
  
  const [, bookName, chapterStr, verseStr] = match;
  
  // Convert book name to format expected by wldeh API
  const book = bookName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\d+/g, (num) => num) // Keep numbers as is
    .replace(/^1/, '1')
    .replace(/^2/, '2')
    .replace(/^3/, '3');
  
  return {
    book,
    chapter: parseInt(chapterStr),
    verse: parseInt(verseStr)
  };
}

/** Search for verses containing specific text or by reference */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    console.log(`Searching for: "${query}" in ${versionId}`);
    
    // Handle HelloAO API versions
    if (versionId.startsWith('helloao_')) {
      return await searchHelloAoVerses(query, versionId.replace('helloao_', ''));
    }
    
    // Handle wldeh API versions
    if (versionId.startsWith('wldeh_')) {
      return await searchWldehVerses(query, versionId.replace('wldeh_', ''));
    }
    
    // Handle original API versions
    if (versionId !== 'kjv' && versionId !== 'asv') {
      throw new Error(`Version ${versionId} is not yet available. Please select an available version.`);
    }
    
    // Check if query looks like a Bible reference
    const referencePattern = /^(\d?\s*\w+)\s*(\d+)?(:(\d+))?(-(\d+))?$/i;
    const match = query.match(referencePattern);
    
    if (match) {
      // It's a reference search
      try {
        const passage = await getPassageByReference(versionId, query);
        if (passage && passage.text) {
          return [passage];
        }
      } catch (error) {
        console.warn(`Failed to fetch reference ${query}:`, error);
      }
    }
    
    // Use our secured search endpoint
    const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        reference: query,
        version: versionId,
        action: 'search'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Search failed:", error);
    return await searchPopularVerses(query, versionId);
  }
}

/** Search HelloAO API versions */
async function searchHelloAoVerses(query: string, versionId: string): Promise<any[]> {
  try {
    const { searchVerses } = await import('./helloAo');
    const hits = await searchVerses(versionId, query);
    
    return hits.slice(0, 10).map((hit: any) => ({
      reference: `${hit.book} ${hit.chapter}:${hit.verse}`,
      text: hit.text || '',
      translation_id: versionId,
      translation_name: versionId.toUpperCase(),
      translation_note: 'HelloAO API'
    }));
  } catch (error) {
    console.error('HelloAO search error:', error);
    return [];
  }
}

/** Search wldeh API versions */
async function searchWldehVerses(query: string, versionId: string): Promise<any[]> {
  // For now, return empty array as wldeh API doesn't have a direct search endpoint
  // This could be enhanced with a local search implementation
  console.log(`Wldeh search not yet implemented for ${versionId}`);
  return [];
}

/** Search popular verses that might match the query */
async function searchPopularVerses(query: string, versionId: string): Promise<any[]> {
  const popularVerses = [
    'John 3:16',
    'Romans 8:28', 
    'Philippians 4:13',
    'Jeremiah 29:11',
    'Psalm 23:1-6',
    'Proverbs 3:5-6',
    'Matthew 11:28',
    'Isaiah 40:31',
    '1 Corinthians 13:4-7',
    'Joshua 1:9',
    'Psalm 1:1-3',
    'Psalm 91:1-2',
    'Matthew 6:26',
    'Romans 12:2',
    'Ephesians 2:8-9'
  ];
  
  const results = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  for (const verse of popularVerses) {
    try {
      const passage = await getPassageByReference(versionId, verse);
      if (passage && passage.text) {
        const passageText = passage.text.toLowerCase();
        const referenceText = passage.reference.toLowerCase();
        
        const matches = searchTerms.some(term => 
          passageText.includes(term) || 
          referenceText.includes(term) ||
          verse.toLowerCase().includes(term)
        );
        
        if (matches) {
          results.push(passage);
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch ${verse}:`, error);
    }
    
    if (results.length >= 10) break;
  }
  
  return results;
}