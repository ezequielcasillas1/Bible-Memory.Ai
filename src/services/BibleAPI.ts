// Bible API implementation using scripture.api.bible
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
}

const SCRIPTURE_API_BASE = 'https://api.scripture.api.bible/v1';
const API_KEY = '6d078a413735440025d1f98883a8d372';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper function to make proxied API calls
async function proxyFetch(url: string, headers: Record<string, string> = {}): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Fallback to direct fetch if Supabase not configured
    console.warn('Supabase not configured, attempting direct API call');
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url, headers }),
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/** Fetch available Bible versions from scripture.api.bible */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from scripture.api.bible');
    
    const url = `${SCRIPTURE_API_BASE}/bibles`;
    const headers = { 'api-key': API_KEY };
    
    const data = await proxyFetch(url, headers);
    
    // Map scripture.api.bible versions to our format
    const versions: BibleVersion[] = [
      { 
        id: 'de4e12af7f28f599-01', 
        abbreviation: 'KJV', 
        name: 'King James Version', 
        description: 'The classic King James Version',
        available: true
      },
      { 
        id: '06125adad2d5898a-01', 
        abbreviation: 'ASV', 
        name: 'American Standard Version', 
        description: 'American Standard Version',
        available: true
      },
      { 
        id: '9879dbb7cfe39e4d-01', 
        abbreviation: 'WEB', 
        name: 'World English Bible', 
        description: 'World English Bible',
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

/** Fetch a passage by Bible version and reference using scripture.api.bible */
export async function getPassageByReference(versionId: string, reference: string): Promise<any> {
  try {
    console.log(`Fetching passage: ${reference} in ${versionId}`);
    
    // Check if version is supported
    const supportedVersions = ['de4e12af7f28f599-01', '06125adad2d5898a-01', '9879dbb7cfe39e4d-01'];
    if (!supportedVersions.includes(versionId)) {
      throw new Error(`Version ${versionId} is not yet available.`);
    }
    
    // Convert reference to scripture.api.bible format
    const scriptureRef = convertToScriptureReference(reference);
    if (!scriptureRef) {
      throw new Error(`Could not parse reference: ${reference}`);
    }
    
    const url = `${SCRIPTURE_API_BASE}/bibles/${versionId}/passages/${scriptureRef}`;
    const headers = { 'api-key': API_KEY };
    
    console.log('API URL:', url);
    
    const data = await proxyFetch(url, headers);
    console.log('API response:', data);
    
    // Convert scripture.api.bible response to our format
    if (data && data.data) {
      return {
        reference: data.data.reference,
        text: data.data.content.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
        translation_id: versionId,
        translation_name: data.data.copyright
      };
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    throw error;
  }
}

/** Search for verses using scripture.api.bible */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    // Check if version is supported
    const supportedVersions = ['de4e12af7f28f599-01', '06125adad2d5898a-01', '9879dbb7cfe39e4d-01'];
    if (!supportedVersions.includes(versionId)) {
      throw new Error(`Version ${versionId} is not yet available.`);
    }
    
    console.log(`Searching for: "${query}" in ${versionId}`);
    
    // Check if query looks like a Bible reference (e.g., "psalms 23", "john 3:16", "romans 8")
    const referencePattern = /^(\d?\s*\w+)\s*(\d+)?(:(\d+))?(-(\d+))?$/i;
    const match = query.match(referencePattern);
    
    if (match) {
      // It's a reference search - try to fetch the specific passage
      try {
        const passage = await getPassageByReference(versionId, query);
        if (passage && passage.text) {
          return [passage];
        }
      } catch (error) {
        console.warn(`Failed to fetch reference ${query}:`, error);
      }
    }
    
    // Use scripture.api.bible search endpoint
    const url = `${SCRIPTURE_API_BASE}/bibles/${versionId}/search?query=${encodeURIComponent(query)}&limit=20`;
    const headers = { 'api-key': API_KEY };
    
    const data = await proxyFetch(url, headers);
    
    if (data && data.data && data.data.verses) {
      return data.data.verses.map((verse: any) => ({
        reference: verse.reference,
        text: verse.text.replace(/<[^>]*>/g, '').trim(), // Remove HTML tags
        translation_id: versionId,
        translation_name: data.data.copyright || 'Scripture API Bible'
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

// Helper function to convert references to scripture.api.bible format
function convertToScriptureReference(reference: string): string | null {
  try {
    // Convert common book names to scripture.api.bible format
    const bookMap: { [key: string]: string } = {
      'psalm': 'PSA',
      'psalms': 'PSA',
      'john': 'JHN',
      'romans': 'ROM',
      'philippians': 'PHP',
      'jeremiah': 'JER',
      'proverbs': 'PRO',
      'matthew': 'MAT',
      'isaiah': 'ISA',
      '1 corinthians': '1CO',
      '2 corinthians': '2CO',
      'joshua': 'JOS',
      'ephesians': 'EPH',
      '1 john': '1JN',
      '2 john': '2JN',
      '3 john': '3JN'
    };
    
    // Parse reference like "Psalm 23" or "John 3:16"
    const match = reference.match(/^(\d?\s*\w+(?:\s+\w+)*)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/i);
    if (match) {
      const bookName = match[1].trim().toLowerCase();
      const chapter = match[2];
      const verse = match[3] || '1';
      const endVerse = match[4];
      
      const bookCode = bookMap[bookName];
      if (bookCode) {
        if (endVerse) {
          return `${bookCode}.${chapter}.${verse}-${bookCode}.${chapter}.${endVerse}`;
        } else if (verse) {
          return `${bookCode}.${chapter}.${verse}`;
        } else {
          return `${bookCode}.${chapter}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting reference:', error);
    return null;
  }
}