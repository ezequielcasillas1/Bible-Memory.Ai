// Bible API Service for fetching verses
// Based on https://github.com/HelloAOLab/bible-api

export interface BibleVerse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
}

export class BibleApiService {
  private static readonly BASE_URL = '/bible-api';

  // Get a specific verse by reference
  static async getVerse(reference: string, version?: string): Promise<BibleVerse> {
    try {
      const url = version 
        ? `${this.BASE_URL}/${encodeURIComponent(reference)}?translation=${version}`
        : `${this.BASE_URL}/${encodeURIComponent(reference)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch verse: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  }

  // Get multiple verses
  static async getVerses(references: string[], version?: string): Promise<BibleVerse[]> {
    try {
      const promises = references.map(ref => this.getVerse(ref, version));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple verses:', error);
      throw error;
    }
  }

  // Get a random verse from a predefined list of powerful verses
  static async getRandomVerse(type: 'commission' | 'help' = 'commission', version?: string): Promise<BibleVerse> {
    const commissionVerses = [
      'John 3:16',
      'Romans 6:23',
      'Romans 10:9',
      'Ephesians 2:8-9',
      'John 14:6',
      '2 Corinthians 5:17',
      'Romans 5:8',
      'John 1:12',
      'Acts 16:31',
      'Romans 3:23',
      'Isaiah 53:6',
      'Jeremiah 29:11',
      'Psalm 23:1',
      'Proverbs 3:5-6',
      '1 John 1:9',
      'Philippians 4:13',
      'Isaiah 41:10',
      'Matthew 11:28',
      'John 10:10',
      'Romans 8:28'
    ];

    const helpVerses = [
      'Psalm 23:4',
      'Isaiah 41:10',
      'Philippians 4:13',
      'Matthew 11:28-30',
      'Psalm 55:22',
      '1 Peter 5:7',
      'Joshua 1:9',
      'Psalm 46:1',
      'Isaiah 40:31',
      'Psalm 34:18',
      'Romans 8:28',
      'Jeremiah 29:11',
      'Psalm 121:1-2',
      'Deuteronomy 31:6',
      'Psalm 27:1',
      'Isaiah 26:3',
      'Philippians 4:19',
      'Psalm 91:1-2',
      'Hebrews 13:5',
      '2 Corinthians 12:9'
    ];

    const verses = type === 'commission' ? commissionVerses : helpVerses;
    const randomIndex = Math.floor(Math.random() * verses.length);
    const selectedReference = verses[randomIndex];

    return await this.getVerse(selectedReference, version);
  }

  // Get verses from a specific book
  static async getChapter(book: string, chapter: number): Promise<BibleVerse> {
    try {
      const reference = `${book} ${chapter}`;
      return await this.getVerse(reference);
    } catch (error) {
      console.error('Error fetching chapter:', error);
      throw error;
    }
  }

  // Search for verses containing specific text (limited functionality with this API)
  static async searchVerses(query: string, limit: number = 10): Promise<BibleVerse[]> {
    // This API doesn't have built-in search, so we'll search through common verses
    const searchableVerses = [
      'John 3:16', 'Romans 6:23', 'Ephesians 2:8-9', 'Romans 10:9',
      'John 14:6', '2 Corinthians 5:17', 'Romans 5:8', 'John 1:12',
      'Psalm 23:1-6', 'Isaiah 41:10', 'Philippians 4:13', 'Matthew 11:28',
      'Jeremiah 29:11', 'Romans 8:28', 'Proverbs 3:5-6', '1 John 1:9',
      'Joshua 1:9', 'Psalm 46:1', 'Isaiah 40:31', 'Psalm 34:18'
    ];

    try {
      const results: BibleVerse[] = [];
      const searchTerm = query.toLowerCase();

      for (const reference of searchableVerses.slice(0, limit)) {
        try {
          const verse = await this.getVerse(reference);
          if (verse.text.toLowerCase().includes(searchTerm)) {
            results.push(verse);
          }
        } catch (error) {
          // Skip verses that fail to load
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  // Helper function to format verse reference
  static formatReference(verse: BibleVerse): string {
    if (verse.verses && verse.verses.length > 0) {
      const firstVerse = verse.verses[0];
      const lastVerse = verse.verses[verse.verses.length - 1];
      
      if (verse.verses.length === 1) {
        return `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}`;
      } else if (firstVerse.chapter === lastVerse.chapter) {
        return `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`;
      } else {
        return `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.chapter}:${lastVerse.verse}`;
      }
    }
    return verse.reference;
  }

  // Helper function to determine testament
  static getTestament(bookName: string): 'OT' | 'NT' {
    const oldTestamentBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
      '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
      'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
      'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
      'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ];

    return oldTestamentBooks.includes(bookName) ? 'OT' : 'NT';
  }

  // Convert Bible API response to our Verse format
  static convertToVerse(bibleVerse: BibleVerse, reason?: string): {
    text: string;
    reference: string;
    testament: 'OT' | 'NT';
    reason?: string;
    id: string;
  } {
    const reference = this.formatReference(bibleVerse);
    const testament = bibleVerse.verses && bibleVerse.verses.length > 0 
      ? this.getTestament(bibleVerse.verses[0].book_name)
      : 'NT';

    return {
      text: bibleVerse.text.replace(/\s+/g, ' ').trim(),
      reference,
      testament,
      reason,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
    };
  }
}