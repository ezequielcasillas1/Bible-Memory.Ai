// Enhanced Bible API implementation supporting multiple sources
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
  source: 'bible-api' | 'helloaolab';
}

const BIBLE_API_BASE = "https://bible-api.com";
const HELLOAOLAB_API_BASE = "https://bible-api.helloao.org";

/** Fetch all available Bible versions from both APIs */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from multiple sources');
    
    // Return all supported versions
    const versions: BibleVersion[] = [
      // Original bible-api.com versions
      { 
        id: 'kjv', 
        abbreviation: 'KJV', 
        name: 'King James Version', 
        description: 'The classic 1769 King James Version',
        available: true,
        source: 'bible-api'
      },
      { 
        id: 'asv', 
        abbreviation: 'ASV', 
        name: 'American Standard Version', 
        description: 'The 1901 American Standard Version',
        available: true,
        source: 'bible-api'
      },
      // HelloAOLab API versions
      { 
        id: 'web', 
        abbreviation: 'WEB', 
        name: 'World English Bible', 
        description: 'Modern English translation in the public domain',
        available: true,
        source: 'helloaolab'
      },
      { 
        id: 'drb', 
        abbreviation: 'DRB', 
        name: 'Douay-Rheims Bible', 
        description: 'Catholic translation from the Latin Vulgate',
        available: true,
        source: 'helloaolab'
      },
      { 
        id: 'darby', 
        abbreviation: 'DARBY', 
        name: 'Darby Translation', 
        description: 'John Nelson Darby\'s literal translation',
        available: true,
        source: 'helloaolab'
      },
      { 
        id: 'ylt', 
        abbreviation: 'YLT', 
        name: 'Young\'s Literal Translation', 
        description: 'Robert Young\'s word-for-word translation',
        available: true,
        source: 'helloaolab'
      },
      // Coming soon versions
      { 
        id: 'nkjv', 
        abbreviation: 'NKJV', 
        name: 'New King James Version', 
        description: 'Coming Soon',
        available: false,
        source: 'bible-api'
      },
      { 
        id: 'nlt', 
        abbreviation: 'NLT', 
        name: 'New Living Translation', 
        description: 'Coming Soon',
        available: false,
        source: 'bible-api'
      },
      { 
        id: 'esv', 
        abbreviation: 'ESV', 
        name: 'English Standard Version', 
        description: 'Coming Soon',
        available: false,
        source: 'bible-api'
      }
    ];
    
    console.log('Loaded Bible versions:', versions);
    return versions;
  } catch (error) {
    console.error("Failed to load Bible versions:", error);
    throw error;
  }
}

/** Helper: fetch a passage by Bible version and reference from the appropriate API */
export async function getPassageByReference(versionId: string, reference: string): Promise<any> {
  try {
    console.log(`Fetching passage: ${reference} in ${versionId}`);
    
    // Get version info to determine which API to use
    const versions = await getBibleVersions();
    const version = versions.find(v => v.id === versionId);
    
    if (!version || !version.available) {
      throw new Error(`Version ${versionId} is not available.`);
    }
    
    let url: string;
    let apiResponse: any;
    
    if (version.source === 'bible-api') {
      // Use original bible-api.com for KJV and ASV
      const formattedReference = reference.toLowerCase().replace(/\s+/g, '+');
      url = `${BIBLE_API_BASE}/${formattedReference}?translation=${versionId}`;
      
      console.log('Bible-API URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
      }
      
      apiResponse = await response.json();
    } else {
      // Use HelloAOLab API for WEB, DRB, DARBY, YLT
      // Format: GET /api/bible/{version}/{book}/{chapter}
      const parsedRef = parseReference(reference);
      if (!parsedRef) {
        throw new Error(`Invalid reference format: ${reference}`);
      }
      
      url = `${HELLOAOLAB_API_BASE}/api/bible/${versionId.toUpperCase()}/${parsedRef.book}/${parsedRef.chapter}`;
      
      console.log('HelloAOLab API URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HelloAOLab API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform HelloAOLab response to match bible-api.com format
      if (data && data.verses) {
        let verseText = '';
        let verseNumbers = [];
        
        if (parsedRef.verse) {
          // Single verse requested
          const verse = data.verses.find((v: any) => v.verse === parsedRef.verse);
          if (verse) {
            verseText = verse.text;
            verseNumbers = [parsedRef.verse];
          }
        } else {
          // Whole chapter requested
          verseText = data.verses.map((v: any) => v.text).join(' ');
          verseNumbers = data.verses.map((v: any) => v.verse);
        }
        
        apiResponse = {
          reference: `${data.book} ${data.chapter}${parsedRef.verse ? `:${parsedRef.verse}` : ''}`,
          text: verseText,
          translation_id: versionId.toUpperCase(),
          translation_name: version.name,
          translation_note: version.description
        };
      } else {
        throw new Error('Invalid response from HelloAOLab API');
      }
    }
    
    console.log('API response:', apiResponse);
    return apiResponse;
    
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    throw error;
  }
}

/** Parse Bible reference into components */
function parseReference(reference: string): { book: string; chapter: number; verse?: number } | null {
  // Handle various reference formats like "John 3:16", "Psalms 23", "1 Corinthians 13:4-7"
  const patterns = [
    /^(\d?\s*\w+)\s+(\d+):(\d+)(?:-\d+)?$/i,  // "John 3:16" or "1 Cor 13:4-7"
    /^(\d?\s*\w+)\s+(\d+)$/i,                  // "Psalms 23"
  ];
  
  for (const pattern of patterns) {
    const match = reference.match(pattern);
    if (match) {
      const book = match[1].trim();
      const chapter = parseInt(match[2]);
      const verse = match[3] ? parseInt(match[3]) : undefined;
      
      // Map common book name variations for HelloAOLab API
      const bookMapping: { [key: string]: string } = {
        'psalms': 'psalm',
        'psalm': 'psalm',
        '1 corinthians': '1corinthians',
        '2 corinthians': '2corinthians',
        '1 timothy': '1timothy',
        '2 timothy': '2timothy',
        '1 peter': '1peter',
        '2 peter': '2peter',
        '1 john': '1john',
        '2 john': '2john',
        '3 john': '3john',
        '1 kings': '1kings',
        '2 kings': '2kings',
        '1 samuel': '1samuel',
        '2 samuel': '2samuel',
        '1 chronicles': '1chronicles',
        '2 chronicles': '2chronicles'
      };
      
      const normalizedBook = bookMapping[book.toLowerCase()] || book.toLowerCase().replace(/\s+/g, '');
      
      return {
        book: normalizedBook,
        chapter,
        verse
      };
    }
  }
  
  return null;
}

/** Search for verses containing specific text or by reference */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    console.log(`Searching for: "${query}" in ${versionId}`);
    
    // Get version info to determine which API to use
    const versions = await getBibleVersions();
    const version = versions.find(v => v.id === versionId);
    
    if (!version || !version.available) {
      throw new Error(`Version ${versionId} is not available.`);
    }
    
    // Check if query looks like a Bible reference
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
    
    // For text searches or failed reference searches, try popular verses that might match
    const popularVerses = [
      'John 3:16',
      'Romans 8:28', 
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Psalm 23:1',
      'Proverbs 3:5-6',
      'Matthew 11:28',
      'Isaiah 40:31',
      '1 Corinthians 13:4',
      'Joshua 1:9',
      'Psalm 1:1',
      'Psalm 91:1',
      'Matthew 6:26',
      'Romans 12:2',
      'Ephesians 2:8-9'
    ];
    
    const results = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    // Try to fetch verses that might match the search
    for (const verse of popularVerses) {
      try {
        const passage = await getPassageByReference(versionId, verse);
        if (passage && passage.text) {
          // Check if the passage matches the search terms
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
      
      // Limit results to avoid too many API calls
      if (results.length >= 10) break;
    }
    
    return results;
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}