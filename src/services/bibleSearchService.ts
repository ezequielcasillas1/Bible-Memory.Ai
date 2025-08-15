import { SearchResult } from '../types';
import { getVersionById } from '../data/bibleVersions';

const SCRIPTURE_API_BASE = 'https://api.scripture.api.bible/v1';
const API_KEY = '6d078a413735440025d1f98883a8d372';

export class BibleSearchService {
  static async searchVerses(query: string, versionId: string, limit: number = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${SCRIPTURE_API_BASE}/bibles/${versionId}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'api-key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search verses');
      }

      const data = await response.json();
      const version = getVersionById(versionId);
      
      return data.data.passages?.map((passage: any) => ({
        id: `search-${passage.id}`,
        text: this.cleanVerseText(passage.content),
        reference: passage.reference,
        testament: this.determineTestament(passage.reference),
        book: this.extractBook(passage.reference),
        chapter: this.extractChapter(passage.reference),
        verse: this.extractVerse(passage.reference),
        version: version?.abbreviation || 'KJV'
      })) || [];
    } catch (error) {
      console.error('Bible search failed:', error);
      return this.fallbackSearch(query);
    }
  }

  static async getVerseByReference(reference: string, versionId: string): Promise<SearchResult | null> {
    try {
      const searchResults = await this.searchVerses(reference, versionId, 1);
      return searchResults[0] || null;
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

    const bookName = reference.split(' ')[0];
    return otBooks.includes(bookName) ? 'OT' : 'NT';
  }

  private static extractBook(reference: string): string {
    return reference.split(' ').slice(0, -1).join(' ');
  }

  private static extractChapter(reference: string): number {
    const parts = reference.split(' ');
    const chapterVerse = parts[parts.length - 1];
    return parseInt(chapterVerse.split(':')[0]);
  }

  private static extractVerse(reference: string): number {
    const parts = reference.split(' ');
    const chapterVerse = parts[parts.length - 1];
    const versePart = chapterVerse.split(':')[1];
    return parseInt(versePart?.split('-')[0] || '1');
  }

  private static fallbackSearch(query: string): SearchResult[] {
    // Fallback with some popular verses that might match the query
    const fallbackVerses = [
      {
        id: 'fallback-1',
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        reference: 'John 3:16',
        testament: 'NT' as const,
        book: 'John',
        chapter: 3,
        verse: 16,
        version: 'KJV'
      },
      {
        id: 'fallback-2',
        text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
        reference: 'Proverbs 3:5',
        testament: 'OT' as const,
        book: 'Proverbs',
        chapter: 3,
        verse: 5,
        version: 'KJV'
      }
    ];

    return fallbackVerses.filter(verse => 
      verse.text.toLowerCase().includes(query.toLowerCase()) ||
      verse.reference.toLowerCase().includes(query.toLowerCase())
    );
  }
}