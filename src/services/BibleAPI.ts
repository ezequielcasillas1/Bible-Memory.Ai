// Enhanced Bible API implementation supporting multiple sources
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
  source: 'bible-api' | 'wldeh-api';
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
      },
      { 
        id: 'darby', 
        abbreviation: 'DARBY', 
        name: 'Darby Translation', 
        description: 'The 1890 Darby Translation by John Nelson Darby',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      },
      { 
        id: 'bbe', 
        abbreviation: 'BBE', 
        name: 'Bible in Basic English', 
        description: 'The 1965 Bible in Basic English - simple, clear language',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      },
      { 
        id: 'oeb-us', 
        abbreviation: 'OEB-US', 
        name: 'Open English Bible (US)', 
        description: 'Modern English translation with American spelling and idioms',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      },
      { 
        id: 'webbe', 
        abbreviation: 'WEBBE', 
        name: 'World English Bible British Edition', 
        description: 'Modern English translation with British spelling and idioms',
        available: true,
        source: 'bible-api',
        license: 'Public Domain'
      }
    ];

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
    
    // Add international Bible versions based on supported languages
    const { supportedLanguages, bibleTranslations } = await import('./translationService');
    const internationalVersions: BibleVersion[] = [];
    
    for (const language of supportedLanguages) {
      if (language.code !== 'en' && language.bibleSupported) {
        const translations = bibleTranslations[language.code] || [];
        for (const translation of translations) {
          internationalVersions.push({
            id: `${language.code}_${translation.version}`,
            abbreviation: `${translation.abbreviation} (${language.flag})`,
            name: `${translation.name} - ${language.name}`,
            description: `${translation.name} in ${language.nativeName}`,
            available: true,
            source: 'international-api',
            license: 'Various'
          });
        }
      }
    }
    
    const allVersions = [...originalVersions, ...wldehVersions, ...internationalVersions, ...comingSoonVersions];
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
    
    // Check if this is a request for international Bible content
    if (versionId.includes('_')) {
      const [language, version] = versionId.split('_');
      if (language !== 'en') {
        const { InternationalBibleAPI } = await import('./internationalBibleAPI');
        return await InternationalBibleAPI.getVerse(reference, version, language);
      }
    }
    
    // Handle wldeh API versions
    if (versionId.startsWith('wldeh_')) {
      const actualVersionId = versionId.replace('wldeh_', '');
      return await getWldehPassage(actualVersionId, reference);
    }
    
    // Handle original bible-api.com versions (KJV, ASV) - now secured through our API
    if (versionId !== 'kjv' && versionId !== 'asv' && versionId !== 'darby' && versionId !== 'bbe' && versionId !== 'oeb-us' && versionId !== 'webbe') {
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
    
    // Check if we got a fallback response
    if (data.fallback) {
      console.log('Primary API failed, using fallback mechanism');
      // Try InternationalBibleAPI for English content
      try {
        const { InternationalBibleAPI } = await import('./internationalBibleAPI');
        const fallbackResult = await InternationalBibleAPI.getVerse(reference, versionId, 'en');
        if (fallbackResult) {
          return {
            reference: fallbackResult.reference,
            text: fallbackResult.text,
            translation_id: versionId,
            translation_name: versionId.toUpperCase(),
            translation_note: 'Retrieved via fallback service'
          };
        }
      } catch (fallbackError) {
        console.warn('Fallback API also failed:', fallbackError);
      }
      
      // Final fallback to popular verses
      return await getPopularVerseFallback(reference, versionId);
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    
    // Try fallback mechanism on network errors
    try {
      const { InternationalBibleAPI } = await import('./internationalBibleAPI');
      const fallbackResult = await InternationalBibleAPI.getVerse(reference, versionId, 'en');
      if (fallbackResult) {
        return {
          reference: fallbackResult.reference,
          text: fallbackResult.text,
          translation_id: versionId,
          translation_name: versionId.toUpperCase(),
          translation_note: 'Retrieved via fallback service'
        };
      }
    } catch (fallbackError) {
      console.warn('All fallback methods failed:', fallbackError);
    }
    
    // Final fallback to popular verses
    return await getPopularVerseFallback(reference, versionId);
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
    
    // Check if this is a request for international Bible content
    if (versionId.includes('_')) {
      const [language, version] = versionId.split('_');
      if (language !== 'en') {
        const { InternationalBibleAPI } = await import('./internationalBibleAPI');
        return await InternationalBibleAPI.searchVerses(query, version, language);
      }
    }
    
    // Handle wldeh API versions
    if (versionId.startsWith('wldeh_')) {
      return await searchWldehVerses(query, versionId.replace('wldeh_', ''));
    }
    
    // Handle original API versions
    if (versionId !== 'kjv' && versionId !== 'asv' && versionId !== 'darby' && versionId !== 'bbe' && versionId !== 'oeb-us' && versionId !== 'webbe') {
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
    
    // Check if we got a fallback response
    if (data.fallback) {
      console.log('Primary search API failed, using fallback');
      return await searchPopularVerses(query, versionId);
    }
    
    return data.results || [];
  } catch (error) {
    console.error("Search failed:", error);
    return await searchPopularVerses(query, versionId);
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

/** Fallback to popular verses when API fails */
async function getPopularVerseFallback(reference: string, versionId: string): Promise<any> {
  const popularVerses = {
    'John 3:16': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    'Romans 8:28': 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    'Philippians 4:13': 'I can do all this through him who gives me strength.',
    'Jeremiah 29:11': 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future.',
    'Psalm 23:1': 'The Lord is my shepherd, I lack nothing.',
    'Proverbs 3:5': 'Trust in the Lord with all your heart and lean not on your own understanding.',
    'Matthew 11:28': 'Come to me, all you who are weary and burdened, and I will give you rest.',
    'Isaiah 40:31': 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    'Joshua 1:9': 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'
  };
  
  // Try to find exact match first
  const exactMatch = popularVerses[reference as keyof typeof popularVerses];
  if (exactMatch) {
    return {
      reference,
      text: exactMatch,
      translation_id: versionId,
      translation_name: versionId.toUpperCase(),
      translation_note: 'Popular verse fallback'
    };
  }
  
  // Try partial match
  const partialMatch = Object.entries(popularVerses).find(([key]) => 
    key.toLowerCase().includes(reference.toLowerCase()) || 
    reference.toLowerCase().includes(key.toLowerCase())
  );
  
  if (partialMatch) {
    return {
      reference: partialMatch[0],
      text: partialMatch[1],
      translation_id: versionId,
      translation_name: versionId.toUpperCase(),
      translation_note: 'Popular verse fallback'
    };
  }
  
  // Default fallback
  return {
    reference: 'John 3:16',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    translation_id: versionId,
    translation_name: versionId.toUpperCase(),
    translation_note: 'Default fallback verse'
  };
}