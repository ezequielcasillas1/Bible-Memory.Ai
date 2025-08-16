// New Bible API implementation using https://github.com/wldeh/bible-api
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
}

const BIBLE_API_BASE = "https://bible-api.com";

/** Fetch the 2 available Bible versions (KJV and ASV) */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from bible-api.com and other sources');
    
    // Return all supported free versions
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
      { 
        id: 'web', 
        abbreviation: 'WEB', 
        name: 'World English Bible', 
        description: 'Modern English public domain translation',
        available: true
      },
      { 
        id: 'ylt', 
        abbreviation: 'YLT', 
        name: "Young's Literal Translation", 
        description: '1898 literal translation by Robert Young',
        available: true
      },
      { 
        id: 'darby', 
        abbreviation: 'DARBY', 
        name: 'Darby Bible', 
        description: '1890 translation by John Nelson Darby',
        available: true
      },
      { 
        id: 'drb', 
        abbreviation: 'DRB', 
        name: 'Douay-Rheims Bible', 
        description: 'Catholic translation (public domain)',
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
    
    // Check if version is supported
    const supportedVersions = ['kjv', 'asv', 'web', 'ylt', 'darby', 'drb'];
    if (!supportedVersions.includes(versionId)) {
      throw new Error(`Version ${versionId} is not yet available. Supported versions: ${supportedVersions.join(', ')}.`);
    }
    
    // Format the URL based on the API source
    const formattedReference = reference.toLowerCase().replace(/\s+/g, '+');
    
    let url: string;
    if (versionId === 'kjv' || versionId === 'asv') {
      // Use bible-api.com for KJV and ASV
      url = `${BIBLE_API_BASE}/${formattedReference}?translation=${versionId}`;
    } else {
      // Use getbible.net API for other versions
      const apiVersionMap: { [key: string]: string } = {
        'web': 'web',
        'ylt': 'ylt',
        'darby': 'darby',
        'drb': 'douayrheims'
      };
      const apiVersion = apiVersionMap[versionId] || versionId;
      
      // Parse reference for getbible.net format (book/chapter/verse)
      const parsedRef = parseReference(reference);
      if (parsedRef) {
        url = `https://getbible.net/json?passage=${parsedRef.book}+${parsedRef.chapter}:${parsedRef.verse}&version=${apiVersion}`;
      } else {
        throw new Error(`Could not parse reference: ${reference}`);
      }
    }
    
    console.log('API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Bible API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch passage: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    // Normalize response format
    if (versionId === 'kjv' || versionId === 'asv') {
      return data;
    } else {
      // Convert getbible.net response to our format
      if (data && data.book && data.book.length > 0) {
        const book = data.book[0];
        const chapter = book.chapter;
        const verses = Object.values(chapter).join(' ');
        
        return {
          reference: reference,
          text: verses,
          translation_id: versionId,
          translation_name: getBibleVersions().then(versions => 
            versions.find(v => v.id === versionId)?.name || versionId.toUpperCase()
          )
        };
      }
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    throw error;
  }
}

/** Search for verses containing specific text or by reference */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    // Check if version is supported
    const supportedVersions = ['kjv', 'asv', 'web', 'ylt', 'darby', 'drb'];
    if (!supportedVersions.includes(versionId)) {
      throw new Error(`Version ${versionId} is not yet available. Supported versions: ${supportedVersions.join(', ')}.`);
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
    
    // For text searches or failed reference searches, try popular verses that might match
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

// Helper function to parse Bible references
function parseReference(reference: string): { book: string; chapter: number; verse: number } | null {
  try {
    // Handle various reference formats
    const patterns = [
      /^(\d?\s*\w+(?:\s+\w+)*)\s+(\d+):(\d+)(?:-\d+)?$/i, // "John 3:16" or "1 John 3:16"
      /^(\d?\s*\w+(?:\s+\w+)*)\s+(\d+)$/i, // "Psalm 23"
    ];
    
    for (const pattern of patterns) {
      const match = reference.match(pattern);
      if (match) {
        const book = match[1].trim();
        const chapter = parseInt(match[2]);
        const verse = match[3] ? parseInt(match[3]) : 1;
        
        // Convert book names to getbible.net format
        const bookMap: { [key: string]: string } = {
          'psalm': 'psalms',
          'psalms': 'psalms',
          '1 john': '1john',
          '2 john': '2john',
          '3 john': '3john',
          '1 peter': '1peter',
          '2 peter': '2peter',
          '1 samuel': '1samuel',
          '2 samuel': '2samuel',
          '1 kings': '1kings',
          '2 kings': '2kings',
          '1 chronicles': '1chronicles',
          '2 chronicles': '2chronicles',
          '1 corinthians': '1corinthians',
          '2 corinthians': '2corinthians',
          '1 thessalonians': '1thessalonians',
          '2 thessalonians': '2thessalonians',
          '1 timothy': '1timothy',
          '2 timothy': '2timothy'
        };
        
        const normalizedBook = bookMap[book.toLowerCase()] || book.toLowerCase().replace(/\s+/g, '');
        
        return {
          book: normalizedBook,
          chapter,
          verse
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing reference:', error);
    return null;
  }
}