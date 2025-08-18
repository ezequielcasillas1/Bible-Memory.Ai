import { SearchResult } from '../types';
import { getVersionById } from '../data/bibleVersions';
import { BibleVersion } from './BibleAPI';
import { fetchPassageHTML, WldehVersion, WldehVersions } from './wldeh';

const SCRIPTURE_API_BASE = 'https://api.scripture.api.bible/v1';
const API_KEY = '6d078a413735440025d1f98883a8d372';

export class BibleSearchService {
  static async searchVerses(query: string, versionId: string, availableVersions: BibleVersion[], limit: number = 20): Promise<SearchResult[]> {
    try {
      // Map to wldeh version
      const wldehVersion = (WldehVersions.includes(versionId as any) ? versionId : 'en-kjv') as WldehVersion;
      const version = availableVersions.find(v => v.id === versionId);
      
      // Try to fetch as Bible reference
      const { html, reference, isReference } = await fetchPassageHTML(wldehVersion, query);
      
      if (isReference && html) {
        const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        return [{
          id: `search-${Date.now()}-${Math.random()}`,
          text,
          html,
          reference: reference || query,
          testament: this.determineTestament(reference || query),
          book: this.extractBook(reference || query),
          chapter: this.extractChapter(reference || query),
          verse: this.extractVerse(reference || query),
          version: version?.abbreviation || 'KJV'
        }];
      }
      
      // If not a reference, fall back to keyword search
      return this.fallbackSearch(query, versionId, availableVersions);
    } catch (error) {
      console.error('Bible search failed:', error);
      return this.fallbackSearch(query, versionId, availableVersions);
    }
  }

  static async getVerseByReference(reference: string, versionId: string, availableVersions: BibleVersion[]): Promise<SearchResult | null> {
    try {
      // Map to wldeh version
      const wldehVersion = (WldehVersions.includes(versionId as any) ? versionId : 'en-kjv') as WldehVersion;
      const version = availableVersions.find(v => v.id === versionId);
      
      const { html, reference: ref, isReference } = await fetchPassageHTML(wldehVersion, reference);
      
      if (!isReference || !html) return null;
      
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return {
        id: `verse-${Date.now()}`,
        text,
        html,
        reference: ref || reference,
        testament: this.determineTestament(reference),
        book: this.extractBook(reference),
        chapter: this.extractChapter(reference),
        verse: this.extractVerse(reference),
        version: version?.abbreviation || 'KJV'
      };
    } catch (error) {
      console.error('Failed to get verse by reference:', error);
      return null;
    }
  }

  private static cleanVerseText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private static determineTestament(reference: string): 'OT' | 'NT' {
    const otBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ];

    const referenceLower = reference.toLowerCase();
    const isOT = otBooks.some(book => referenceLower.includes(book.toLowerCase()));
    return isOT ? 'OT' : 'NT';
  }

  private static extractBook(reference: string): string {
    const parts = reference.split(' ');
    if (parts.length === 1) return reference;
    
    // Handle cases like "1 Samuel 1:1" or "Psalm 23:1"
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes(':') || /^\d+$/.test(lastPart)) {
      return parts.slice(0, -1).join(' ');
    }
    return reference;
  }

  private static extractChapter(reference: string): number {
    const parts = reference.split(' ');
    const chapterVerse = parts[parts.length - 1];
    const chapterNum = chapterVerse.split(':')[0];
    return parseInt(chapterNum) || 1;
  }

  private static extractVerse(reference: string): number {
    const parts = reference.split(' ');
    const chapterVerse = parts[parts.length - 1];
    const versePart = chapterVerse.split(':')[1];
    return parseInt(versePart?.split('-')[0] || '1') || 1;
  }

  private static fallbackSearch(query: string, versionId?: string, availableVersions?: BibleVersion[]): SearchResult[] {
    // Expanded fallback with popular verses that might match the query
    const version = versionId && availableVersions ? 
      availableVersions.find(v => v.id === versionId)?.abbreviation || 'KJV' : 'KJV';
    const fallbackVerses = [
      {
        id: 'fallback-1',
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        reference: 'John 3:16',
        testament: 'NT' as const,
        book: 'John',
        chapter: 3,
        verse: 16,
        version
      },
      {
        id: 'fallback-2',
        text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
        reference: 'Proverbs 3:5',
        testament: 'OT' as const,
        book: 'Proverbs',
        chapter: 3,
        verse: 5,
        version
      },
      {
        id: 'fallback-3',
        text: 'I can do all things through Christ which strengtheneth me.',
        reference: 'Philippians 4:13',
        testament: 'NT' as const,
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        version
      },
      {
        id: 'fallback-4',
        text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        reference: 'Romans 8:28',
        testament: 'NT' as const,
        book: 'Romans',
        chapter: 8,
        verse: 28,
        version
      },
      {
        id: 'fallback-5',
        text: 'The Lord is my shepherd; I shall not want.',
        reference: 'Psalm 23:1',
        testament: 'OT' as const,
        book: 'Psalm',
        chapter: 23,
        verse: 1,
        version
      },
      {
        id: 'fallback-6',
        text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.',
        reference: 'Jeremiah 29:11',
        testament: 'OT' as const,
        book: 'Jeremiah',
        chapter: 29,
        verse: 11,
        version
      },
      {
        id: 'fallback-7',
        text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.',
        reference: 'Joshua 1:9',
        testament: 'OT' as const,
        book: 'Joshua',
        chapter: 1,
        verse: 9,
        version
      },
      {
        id: 'fallback-8',
        text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
        reference: 'Matthew 11:28',
        testament: 'NT' as const,
        book: 'Matthew',
        chapter: 11,
        verse: 28,
        version
      }
    ];

    return fallbackVerses.filter(verse => 
      verse.text.toLowerCase().includes(query.toLowerCase()) ||
      verse.reference.toLowerCase().includes(query.toLowerCase()) ||
      verse.book.toLowerCase().includes(query.toLowerCase())
    );
  }
}