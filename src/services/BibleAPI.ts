// New Bible API implementation using wldeh/bible-api CDN
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
  available: boolean;
}

// Versions that are present in wldeh (commercial-safe, PD)
export const SUPPORTED_VERSIONS = [
  'en-kjv',   // King James Version
  'en-asv',   // American Standard Version (1901)
  'en-webus', // World English Bible (US)
  'en-ylt',   // Young's Literal Translation
  'en-darby', // Darby Bible
  'en-drb',   // Douay-Rheims
] as const;

// Book slug map (folder names in wldeh)
const BOOK_SLUG: Record<string, string> = {
  'genesis': 'genesis', 'exodus': 'exodus', 'leviticus': 'leviticus',
  'numbers': 'numbers', 'deuteronomy': 'deuteronomy',
  'joshua': 'joshua', 'judges': 'judges', 'ruth': 'ruth',
  '1 samuel': '1-samuel', '2 samuel': '2-samuel',
  '1 kings': '1-kings', '2 kings': '2-kings',
  '1 chronicles': '1-chronicles', '2 chronicles': '2-chronicles',
  'ezra': 'ezra', 'nehemiah': 'nehemiah', 'esther': 'esther',
  'job': 'job', 'psalm': 'psalms', 'psalms': 'psalms', 'proverbs': 'proverbs',
  'ecclesiastes': 'ecclesiastes', 'song of solomon': 'song-of-solomon',
  'isaiah': 'isaiah', 'jeremiah': 'jeremiah', 'lamentations': 'lamentations',
  'ezekiel': 'ezekiel', 'daniel': 'daniel',
  'hosea': 'hosea', 'joel': 'joel', 'amos': 'amos', 'obadiah': 'obadiah',
  'jonah': 'jonah', 'micah': 'micah', 'nahum': 'nahum', 'habakkuk': 'habakkuk',
  'zephaniah': 'zephaniah', 'haggai': 'haggai', 'zechariah': 'zechariah', 'malachi': 'malachi',
  'matthew': 'matthew', 'mark': 'mark', 'luke': 'luke', 'john': 'john',
  'acts': 'acts', 'romans': 'romans',
  '1 corinthians': '1-corinthians', '2 corinthians': '2-corinthians',
  'galatians': 'galatians', 'ephesians': 'ephesians', 'philippians': 'philippians',
  'colossians': 'colossians',
  '1 thessalonians': '1-thessalonians', '2 thessalonians': '2-thessalonians',
  '1 timothy': '1-timothy', '2 timothy': '2-timothy',
  'titus': 'titus', 'philemon': 'philemon', 'hebrews': 'hebrews',
  'james': 'james', '1 peter': '1-peter', '2 peter': '2-peter',
  '1 john': '1-john', '2 john': '2-john', '3 john': '3-john',
  'jude': 'jude', 'revelation': 'revelation',
};

const CDN = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

function norm(s: string) { 
  return s.trim().toLowerCase().replace(/\s+/g, ' '); 
}

function parseReference(input: string) {
  // Examples we handle: "John 3:16", "John 3:16-18", "John 3", "Psalm 23"
  const s = norm(input);
  // split book from rest by first digit
  const m = s.match(/^(.+?)\s+(\d.*)$/);
  if (!m) {
    // Whole-book? We'll treat as chapter 1 (common UX)
    const book = BOOK_SLUG[norm(s)];
    if (!book) throw new Error(`Unknown book in reference: "${input}"`);
    return { book, chapter: 1, verseStart: null as number|null, verseEnd: null as number|null };
  }
  const bookName = norm(m[1]);
  const rest = m[2];

  const book = BOOK_SLUG[bookName];
  if (!book) throw new Error(`Unknown book in reference: "${input}"`);

  // rest could be "3", "3:16", "3:16-18"
  const colon = rest.indexOf(':');
  if (colon === -1) {
    const chapter = Number(rest);
    if (!Number.isFinite(chapter)) throw new Error(`Invalid chapter in "${input}"`);
    return { book, chapter, verseStart: null as number|null, verseEnd: null as number|null };
  } else {
    const chapter = Number(rest.slice(0, colon));
    const versePart = rest.slice(colon + 1);
    const dash = versePart.indexOf('-');
    if (dash === -1) {
      const verse = Number(versePart);
      return { book, chapter, verseStart: verse, verseEnd: verse };
    } else {
      const v1 = Number(versePart.slice(0, dash));
      const v2 = Number(versePart.slice(dash + 1));
      return { book, chapter, verseStart: v1, verseEnd: v2 };
    }
  }
}

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    // Bubble up the exact URL + status to help you debug
    throw new Error(`HTTP ${res.status} at ${url}`);
  }
  return res.json();
}

// Returns { reference: string, html: string, text: string }
export async function getPassageFromWldeh(version: string, humanRef: string) {
  if (!SUPPORTED_VERSIONS.includes(version as any)) {
    throw new Error(`Unsupported version slug: ${version}`);
  }
  const { book, chapter, verseStart, verseEnd } = parseReference(humanRef);

  // If no verses: return whole chapter
  if (verseStart == null) {
    const chap = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}.json`);
    // chapter JSON is usually an object of { "1": "text", "2": "text", ... }
    const verses = Object.entries(chap).map(([v, t]) => `<sup>${v}</sup> ${t}`);
    const html = `<div class="chapter">${verses.join(' ')}</div>`;
    const text = Object.values(chap).join(' ');
    return {
      reference: `${humanRef}`,
      html,
      text
    };
  }

  // If single verse
  if (verseStart === verseEnd) {
    const v = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}/verses/${verseStart}.json`);
    // often { verse: "16", text: "..." }
    const text = v.text ?? v[verseStart] ?? JSON.stringify(v);
    const html = `<span class="verse"><sup>${verseStart}</sup> ${text}</span>`;
    return {
      reference: `${humanRef}`,
      html,
      text
    };
  }

  // Range of verses in same chapter
  const chap = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}.json`);
  const out: string[] = [];
  const textParts: string[] = [];
  for (let v = verseStart; v <= (verseEnd ?? verseStart); v++) {
    const t = chap[String(v)];
    if (!t) break; // stop if range exceeds chapter
    out.push(`<span class="verse"><sup>${v}</sup> ${t}</span>`);
    textParts.push(t);
  }
  return {
    reference: `${humanRef}`,
    html: out.join(' '),
    text: textParts.join(' ')
  };
}

/** Fetch the available Bible versions */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    console.log('Loading Bible versions from wldeh/bible-api');
    
    // Return the supported versions from wldeh
    const versions: BibleVersion[] = [
      { 
        id: 'en-kjv', 
        abbreviation: 'KJV', 
        name: 'King James Version', 
        description: 'The classic 1769 King James Version',
        available: true
      },
      { 
        id: 'en-asv', 
        abbreviation: 'ASV', 
        name: 'American Standard Version', 
        description: 'The 1901 American Standard Version',
        available: true
      },
      { 
        id: 'en-webus', 
        abbreviation: 'WEB', 
        name: 'World English Bible', 
        description: 'Modern English translation',
        available: true
      },
      { 
        id: 'en-ylt', 
        abbreviation: 'YLT', 
        name: "Young's Literal Translation", 
        description: 'Literal translation by Robert Young',
        available: true
      },
      { 
        id: 'en-darby', 
        abbreviation: 'DARBY', 
        name: 'Darby Bible', 
        description: 'Translation by John Nelson Darby',
        available: true
      },
      { 
        id: 'en-drb', 
        abbreviation: 'DRB', 
        name: 'Douay-Rheims Bible', 
        description: 'Catholic translation',
        available: true
      },
      // Coming soon versions (not in wldeh)
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
    if (!SUPPORTED_VERSIONS.includes(versionId as any)) {
      throw new Error(`Version ${versionId} is not yet available. Only KJV, ASV, WEB, YLT, DARBY, and DRB are currently supported.`);
    }
    
    const result = await getPassageFromWldeh(versionId, reference);
    
    console.log('API response:', result);
    
    // Convert to expected format
    return {
      reference: result.reference,
      text: result.text,
      html: result.html
    };
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    throw error;
  }
}

/** Search for verses containing specific text or by reference */
export async function searchVerses(query: string, versionId: string = 'en-kjv'): Promise<any[]> {
  try {
    // Check if version is supported
    if (!SUPPORTED_VERSIONS.includes(versionId as any)) {
      throw new Error(`Version ${versionId} is not yet available. Only KJV, ASV, WEB, YLT, DARBY, and DRB are currently supported.`);
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