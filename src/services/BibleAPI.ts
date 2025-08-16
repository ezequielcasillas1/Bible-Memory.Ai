// New Bible API implementation using https://github.com/wldeh/bible-api
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
  available: boolean;
}

const BIBLE_API_BASE = "https://bible-api.com";

/** Fetch the 2 available Bible versions (KJV and ASV) */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from bible-api.com');
    
    // Return the two supported versions
    const versions: BibleVersion[] = [
      { 
        id: 'kjv', 
        abbreviation: 'KJV', 
        name: 'King James Version', 
        description: 'The classic 1769 King James Version',
        available: true
      },
      { 
        id: 'asv', 
        abbreviation: 'ASV', 
        name: 'American Standard Version', 
        description: 'The 1901 American Standard Version',
        available: true
      },
      // Coming soon versions
      { 
        id: 'nkjv', 
        abbreviation: 'NKJV', 
        name: 'New King James Version', 
        description: 'Coming Soon',
        available: false
      },
      { 
        id: 'nlt', 
        abbreviation: 'NLT', 
        name: 'New Living Translation', 
        description: 'Coming Soon',
        available: false
      },
      { 
        id: 'esv', 
        abbreviation: 'ESV', 
        name: 'English Standard Version', 
        description: 'Coming Soon',
        available: false
      }
    ];
    
    console.log('Loaded Bible versions:', versions);
    return versions;
  } catch (error) {
    console.error("Failed to load Bible versions:", error);
    throw error;
  }
}

/** Helper: fetch a passage by Bible version and reference, e.g. "John 3:16" */
export async function getPassageByReference(versionId: string, reference: string): Promise<any> {
  try {
    console.log(`Fetching passage: ${reference} in ${versionId}`);
    
    // Only allow KJV and ASV
    if (versionId !== 'kjv' && versionId !== 'asv') {
      throw new Error(`Version ${versionId} is not yet available. Only KJV and ASV are currently supported.`);
    }
    
    // Format the URL - bible-api.com uses format like: /john+3:16?translation=kjv
    const formattedReference = reference.toLowerCase().replace(/\s+/g, '+');
    const url = `${BIBLE_API_BASE}/${formattedReference}?translation=${versionId}`;
    
    console.log('API URL:', url);
    
    const response = await fetch(url);
    
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

/** Search for verses containing specific text */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    // Only allow KJV and ASV
    if (versionId !== 'kjv' && versionId !== 'asv') {
      throw new Error(`Version ${versionId} is not yet available. Only KJV and ASV are currently supported.`);
    }
    
    // bible-api.com doesn't have a direct search endpoint, so we'll return popular verses
    // that might match the query as a fallback
    console.log(`Searching for: "${query}" in ${versionId}`);
    
    const popularVerses = [
      'John 3:16',
      'Romans 8:28', 
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Psalm 23:1',
      'Proverbs 3:5-6',
      'Matthew 11:28',
      'Isaiah 40:31',
      '1 Corinthians 13:4-7',
      'Joshua 1:9'
    ];
    
    // Try to fetch a few popular verses that might match the query
    const results = [];
    for (const verse of popularVerses.slice(0, 5)) {
      try {
        const passage = await getPassageByReference(versionId, verse);
        if (passage && passage.text && passage.text.toLowerCase().includes(query.toLowerCase())) {
          results.push(passage);
        }
      } catch (error) {
        console.warn(`Failed to fetch ${verse}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}