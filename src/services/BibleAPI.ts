import { renderChapterToHtml, renderChapterToPlain, renderVerseToHtml } from '../utils/renderBible';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  available: boolean;
}

export interface Verse {
  reference: string;
  html: string;
  text: string;
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

// Book slug map (folder names in wldeh/bible-api)
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
export async function getPassageFromWldeh(version: string, humanRef: string): Promise<Verse> {
  if (!SUPPORTED_VERSIONS.includes(version as any)) {
    throw new Error(`Unsupported version slug: ${version}`);
  }
  const { book, chapter, verseStart, verseEnd } = parseReference(humanRef);

  // If no verses: return whole chapter
  if (verseStart == null) {
    const chap = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}.json`);
    const html = renderChapterToHtml(chap);
    const text = renderChapterToPlain(chap);
    return {
      reference: humanRef,
      html,
      text
    };
  }

  // If single verse
  if (verseStart === verseEnd) {
    const v = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}/verses/${verseStart}.json`);
    const html = renderVerseToHtml(v);
    const text = String(v?.text ?? v?.t ?? "");
    return {
      reference: humanRef,
      html,
      text
    };
  }

  // Range of verses in same chapter
  const chap2 = await fetchJSON(`${CDN}/${version}/books/${book}/chapters/${chapter}.json`);
  let outHtml = "";
  let outText = "";
  for (let vNo = verseStart; vNo <= (verseEnd ?? verseStart); vNo++) {
    const t = (Array.isArray(chap2) ? chap2[vNo - 1] : chap2[String(vNo)]);
    if (!t) break; // stop if range exceeds chapter
    outHtml += `<span class="verse"><sup>${vNo}</sup> ${escapeHtml(String(t))}</span> `;
    outText += `${vNo} ${t} `;
  }
  return {
    reference: humanRef,
    html: outHtml.trim(),
    text: outText.trim()
  };
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Legacy function name for compatibility
export async function getPassageByReference(version: string, reference: string): Promise<Verse> {
  return getPassageFromWldeh(version, reference);
}

export function getBibleVersions(): BibleVersion[] {
  return [
    { id: 'en-kjv', name: 'King James Version', abbreviation: 'KJV', available: true },
    { id: 'en-asv', name: 'American Standard Version', abbreviation: 'ASV', available: true },
    { id: 'en-webus', name: 'World English Bible', abbreviation: 'WEB', available: true },
    { id: 'en-ylt', name: 'Young\'s Literal Translation', abbreviation: 'YLT', available: true },
    { id: 'en-darby', name: 'Darby Bible', abbreviation: 'DARBY', available: true },
    { id: 'en-drb', name: 'Douay-Rheims', abbreviation: 'DRB', available: true },
  ];
}

export function getVersionById(id: string, versions: BibleVersion[]): BibleVersion | undefined {
  return versions.find(v => v.id === id);
}

export async function searchVerses(query: string, version: string = 'en-kjv'): Promise<Verse[]> {
  try {
    // Try to parse as a Bible reference first
    const result = await getPassageFromWldeh(version, query);
    return [result];
  } catch (error) {
    // If parsing fails, return empty array
    console.warn('Search failed:', error);
    return [];
  }
}