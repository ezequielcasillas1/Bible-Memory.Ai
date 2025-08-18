// src/utils/bibleRef.ts
export type ParsedRef = {
  bookSlug: string;           // folder name in the repo
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
};

// Lowercase keys, values are folder slugs used by wldeh
const BOOK_SLUG: Record<string, string> = {
  'genesis': 'genesis', 'exodus': 'exodus', 'leviticus': 'leviticus',
  'numbers': 'numbers', 'deuteronomy': 'deuteronomy',
  'joshua': 'joshua', 'judges': 'judges', 'ruth': 'ruth',
  '1 samuel': '1-samuel', '2 samuel': '2-samuel',
  '1 kings': '1-kings', '2 kings': '2-kings',
  '1 chronicles': '1-chronicles', '2 chronicles': '2-chronicles',
  'ezra': 'ezra', 'nehemiah': 'nehemiah', 'esther': 'esther',
  'job': 'job', 'psalm': 'psalms', 'psalms': 'psalms',
  'proverbs': 'proverbs', 'ecclesiastes': 'ecclesiastes',
  'song of solomon': 'song-of-solomon', 'song of songs': 'song-of-solomon',
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

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function tryParseReference(input: string): ParsedRef | null {
  const s = norm(input);

  // If there are no digits, it's not a reference (keyword)
  if (!/\d/.test(s)) return null;

  // Split at the first number (book vs rest)
  const m = s.match(/^(.+?)\s+(\d.*)$/);
  if (!m) return null;

  const bookName = norm(m[1]);
  const rest = m[2];

  const bookSlug = BOOK_SLUG[bookName];
  if (!bookSlug) return null;

  // Cases: "23" (chapter only), "3:16", "3:16-18"
  const colon = rest.indexOf(':');
  if (colon === -1) {
    const chapter = Number(rest);
    if (!Number.isFinite(chapter)) return null;
    return { bookSlug, chapter, verseStart: null, verseEnd: null };
  } else {
    const chapter = Number(rest.slice(0, colon));
    if (!Number.isFinite(chapter)) return null;
    const versePart = rest.slice(colon + 1);
    const dash = versePart.indexOf('-');
    if (dash === -1) {
      const v = Number(versePart);
      if (!Number.isFinite(v)) return null;
      return { bookSlug, chapter, verseStart: v, verseEnd: v };
    } else {
      const v1 = Number(versePart.slice(0, dash));
      const v2 = Number(versePart.slice(dash + 1));
      if (!Number.isFinite(v1) || !Number.isFinite(v2)) return null;
      return { bookSlug, chapter, verseStart: v1, verseEnd: v2 };
    }
  }
}