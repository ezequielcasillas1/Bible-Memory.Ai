// src/services/BibleHelloAo.ts
import { listTranslations, listBooks, fetchChapter, searchVerses } from './helloAo';
import { tryParseReference } from '../utils/bibleRef';
import { renderChapterToHTML, renderRangeToHTML } from '../utils/renderBible';

/** Resolve helloao translation id from a hint ("WEB", "Darby", "YLT", "DRB", "BBE", "WBT", "OEB", "KJV", "ASV") */
export async function resolveTranslationId(hint: string): Promise<string> {
  const all = await listTranslations();
  const want = hint.trim().toLowerCase();

  // exact id
  const byId = all.find(t => t.id.toLowerCase() === want);
  if (byId) return byId.id;

  // exact name, startsWith, includes
  const byName =
    all.find(t => t.name.toLowerCase() === want) ||
    all.find(t => t.name.toLowerCase().startsWith(want)) ||
    all.find(t => t.name.toLowerCase().includes(want));

  if (byName) return byName.id;

  // default: WORLD ENGLISH BIBLE (modern PD) if present, else first
  const web = all.find(t => /world english bible/i.test(t.name));
  return web?.id ?? all[0]?.id;
}

/** Fuzzy book→bookId using helloao list (supports common aliases) */
function normalize(s: string) { return s.trim().toLowerCase().replace(/\s+/g, " "); }

const ALIASES: Record<string, string[]> = {
  "psalms": ["psalm", "psalms", "ps"],
  "song of solomon": ["song of songs", "song of solomon", "canticles"],
  "1 chronicles": ["1 chronicles", "1chr", "1 ch", "i chronicles"],
  "2 chronicles": ["2 chronicles", "2chr", "2 ch", "ii chronicles"],
  "1 kings": ["1 kings", "1ki", "i kings"],
  "2 kings": ["2 kings", "2ki", "ii kings"],
  "1 samuel": ["1 samuel", "1sa", "i samuel"],
  "2 samuel": ["2 samuel", "2sa", "ii samuel"],
  "1 corinthians": ["1 corinthians", "1co", "i corinthians"],
  "2 corinthians": ["2 corinthians", "2co", "ii corinthians"],
  "1 thessalonians": ["1 thessalonians", "1th", "i thessalonians"],
  "2 thessalonians": ["2 thessalonians", "2th", "ii thessalonians"],
  "1 timothy": ["1 timothy", "1ti", "i timothy"],
  "2 timothy": ["2 timothy", "2ti", "ii timothy"],
  "1 peter": ["1 peter", "1pe", "i peter"],
  "2 peter": ["2 peter", "2pe", "ii peter"],
  "1 john": ["1 john", "1jn", "i john"],
  "2 john": ["2 john", "2jn", "ii john"],
  "3 john": ["3 john", "3jn", "iii john"],
};

function aliasMatch(inputNorm: string, targetNorm: string) {
  if (inputNorm === targetNorm) return true;
  const al = ALIASES[targetNorm] || [];
  return al.includes(inputNorm);
}

function resolveBookId(bookNameInput: string, books: {id:string; name:string}[]): string | null {
  const inorm = normalize(bookNameInput);
  let found = books.find(b => normalize(b.name) === inorm);
  if (found) return found.id;

  for (const b of books) {
    const tnorm = normalize(b.name);
    if (aliasMatch(inorm, tnorm)) return b.id;
  }
  found = books.find(b => normalize(b.name).startsWith(inorm));
  if (found) return found.id;
  found = books.find(b => normalize(b.name).includes(inorm));
  return found?.id ?? null;
}

/** FETCH: "John 3:16-18" / "Psalms 23" → HTML string */
export async function getPassageHTML(translationHint: string, humanRef: string) {
  const parsed = tryParseReference(humanRef);
  if (!parsed) return { ok: false as const, reason: "not-a-reference" as const };

  const translationId = await resolveTranslationId(translationHint);
  const books = await listBooks(translationId);
  const bookId = resolveBookId(parsed.bookName, books);
  if (!bookId) return { ok: false as const, reason: "book-not-found" as const };

  const data = await fetchChapter(translationId, bookId, parsed.chapter);

  let html = "";
  if (parsed.verseStart == null) {
    html = renderChapterToHTML(data);
  } else if (parsed.verseStart === parsed.verseEnd) {
    html = renderRangeToHTML(data, parsed.verseStart, parsed.verseStart);
  } else {
    html = renderRangeToHTML(data, parsed.verseStart, parsed.verseEnd!);
  }

  return { ok: true as const, translationId, reference: humanRef, html };
}

/** GENERATE: random verse by topic (uses search → random pick → fetch + render) */
const TOPIC_TERMS: Record<string, string[]> = {
  // you can expand these easily
  commission: [
    "send", "sent", "witness", "ambassador", "preach",
    "ministry of reconciliation", "harvest is plentiful"
  ],
  "help-people": [
    "mercy", "compassion", "give", "share", "alms", "justice",
    "love in deed", "bear one another's burdens"
  ],
};

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export async function generateRandomByTopic(translationHint: string, topicKey: "commission"|"help-people") {
  const translationId = await resolveTranslationId(translationHint);
  const terms = TOPIC_TERMS[topicKey] ?? [];
  if (!terms.length) return { ok: false as const, reason: "unknown-topic" as const };

  // build a small pool across a couple of terms
  const term = pick(terms);
  const hits = await searchVerses(translationId, term);
  if (!Array.isArray(hits) || hits.length === 0) {
    return { ok: false as const, reason: "no-hits" as const };
  }

  // random hit
  const hit = pick(hits);
  // expected fields: hit.book (name or id), hit.chapter, hit.verse
  // resolve bookId from book name if needed
  const books = await listBooks(translationId);
  const bookId = resolveBookId(String(hit.book), books) ?? String(hit.book);

  // fetch chapter and render just the verse we picked
  const data = await fetchChapter(translationId, bookId, Number(hit.chapter));
  const verseNum = Number(hit.verse);
  const html = renderRangeToHTML(data, verseNum, verseNum);

  const reference = `${hit.book} ${hit.chapter}:${hit.verse}`;
  return { ok: true as const, translationId, topic: topicKey, reference, html };
}