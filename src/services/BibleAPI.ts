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
    console.log('Loading Bible versions from wldeh/bible-api');
    
    // Return all supported versions from wldeh/bible-api
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
        id: 'en-webus', 
        abbreviation: 'WEB', 
        name: 'World English Bible (U.S. edition)', 
        description: 'Modern English translation in the public domain',
        available: true
      },
      { 
        id: 'en-ylt', 
        abbreviation: 'YLT', 
        name: "Young's Literal Translation", 
        description: "Young's Literal Translation (1898)",
        available: true
      },
      { 
        id: 'en-darby', 
        abbreviation: 'DARBY', 
        name: 'Darby Bible', 
        description: 'Darby Bible (1890)',
        available: true
      },
      { 
        id: 'en-drb', 
        abbreviation: 'DRB', 
        name: 'Douay-Rheims Bible', 
        description: 'Douay-Rheims Bible',
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
    
    // Check if version is available
    const availableVersions = ['kjv', 'asv', 'en-webus', 'en-ylt', 'en-darby', 'en-drb'];
    if (!availableVersions.includes(versionId)) {
      throw new Error(`Version ${versionId} is not yet available.`);
    }
    
    // Map version IDs to API format
    const versionMap: { [key: string]: string } = {
      'kjv': 'kjv',
      'asv': 'asv', 
      'en-webus': 'webus',
      'en-ylt': 'ylt',
      'en-darby': 'darby',
      'en-drb': 'drb'
    };
    
    const apiVersion = versionMap[versionId] || versionId;
    
    // Format the URL - bible-api.com uses format like: /john+3:16?translation=kjv
    const formattedReference = reference.toLowerCase().replace(/\s+/g, '+');
    const url = `${BIBLE_API_BASE}/${formattedReference}?translation=${apiVersion}`;
    
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

/** Search for verses containing specific text or by reference */
export async function searchVerses(query: string, versionId: string = 'kjv'): Promise<any[]> {
  try {
    // Check if version is available
    const availableVersions = ['kjv', 'asv', 'en-webus', 'en-ylt', 'en-darby', 'en-drb'];
    if (!availableVersions.includes(versionId)) {
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
        // Continue to fallback search instead of throwing
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