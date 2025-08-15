import { Verse } from '../types';

const SCRIPTURE_API_BASE = 'https://api.scripture.api.bible/v1';

export class ScriptureApiService {
  private static apiKey = import.meta.env.VITE_SCRIPTURE_API_KEY;

  static async getVerse(reference: string, versionId: string): Promise<Verse | null> {
    if (!this.apiKey) {
      console.warn('Scripture API key not configured');
      return null;
    }

    try {
      // First, search for the passage to get the correct ID
      const searchResponse = await fetch(
        `${SCRIPTURE_API_BASE}/bibles/${versionId}/search?query=${encodeURIComponent(reference)}&limit=1`,
        {
          headers: {
            'api-key': this.apiKey,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search for verse');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.data?.passages?.length) {
        return null;
      }

      const passage = searchData.data.passages[0];
      
      // Get the full verse content
      const verseResponse = await fetch(
        `${SCRIPTURE_API_BASE}/bibles/${versionId}/passages/${passage.id}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`,
        {
          headers: {
            'api-key': this.apiKey,
          },
        }
      );

      if (!verseResponse.ok) {
        throw new Error('Failed to fetch verse content');
      }

      const verseData = await verseResponse.json();
      
      return {
        id: `scripture-${passage.id}`,
        text: verseData.data.content.trim(),
        reference: passage.reference,
        testament: this.determineTestament(passage.reference),
      };
    } catch (error) {
      console.error('Scripture API error:', error);
      return null;
    }
  }

  static async getRandomVerse(versionId: string, testament?: 'OT' | 'NT'): Promise<Verse | null> {
    // For now, we'll use a predefined list of popular verses
    // In a full implementation, you might want to maintain a database of verse references
    const popularVerses = testament === 'OT' ? [
      'Jeremiah 29:11',
      'Proverbs 3:5-6',
      'Psalm 23:1-2',
      'Isaiah 40:31',
      'Psalm 46:10'
    ] : [
      'John 3:16',
      'Romans 8:28',
      'Philippians 4:13',
      'Matthew 11:28',
      '2 Corinthians 5:17'
    ];

    const randomReference = popularVerses[Math.floor(Math.random() * popularVerses.length)];
    return this.getVerse(randomReference, versionId);
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
}