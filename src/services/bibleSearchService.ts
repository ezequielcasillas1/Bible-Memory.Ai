import { SearchResult } from '../types';
import { getVersionById } from '../data/bibleVersions';
import { BibleVersion, getPassageByReference, searchVerses } from './BibleAPI';
import { getPassageHTML, generateRandomByTopic } from './BibleHelloAo';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class BibleSearchService {
  static async searchVerses(query: string, versionId: string, availableVersions: BibleVersion[], limit: number = 20): Promise<SearchResult[]> {
    try {
      // Check if the version is available
      const version = availableVersions.find(v => v.id === versionId);
      if (!version || !version.available) {
        console.warn(`Version ${versionId} is not available, using fallback search`);
        return this.fallbackSearch(query, versionId, availableVersions);
      }

      const apiResults = await searchVerses(query, versionId);
      
      return apiResults.map((passage: any) => ({
        id: `search-${Date.now()}-${Math.random()}`,
        text: this.cleanVerseText(passage.text || ''),
        reference: passage.reference || query,
        testament: this.determineTestament(passage.reference || query),
        book: this.extractBook(passage.reference || query),
        chapter: this.extractChapter(passage.reference || query),
        verse: this.extractVerse(passage.reference || query),
        version: version.abbreviation
      }));
    } catch (error) {
      console.error('Bible search failed:', error);
      return this.fallbackSearch(query, versionId, availableVersions);
    }
  }

  static async getVerseByReference(reference: string, versionId: string, availableVersions: BibleVersion[]): Promise<SearchResult | null> {
    try {
      // Check if the version is available
      const version = availableVersions.find(v => v.id === versionId);
      if (!version || !version.available) {
        console.warn(`Version ${versionId} is not available`);
        return null;
      }

      const passage = await getPassageByReference(versionId, reference);
      
      if (!passage) return null;
      
      return {
        id: `verse-${Date.now()}`,
        text: this.cleanVerseText(passage.text || ''),
        reference: passage.reference || reference,
        testament: this.determineTestament(reference),
        book: this.extractBook(reference),
        chapter: this.extractChapter(reference),
        verse: this.extractVerse(reference),
        version: version.abbreviation
      };
    } catch (error) {
      console.error('Failed to get verse by reference:', error);
      return null;
    }
  }

  static async getRandomVerse(versionId: string, testament: 'OT' | 'NT'): Promise<any> {
    try {
      // Popular verses for random selection
      const otVerses = [
        'Jeremiah 29:11', 'Proverbs 3:5-6', 'Psalm 23:1', 'Isaiah 40:31',
        'Joshua 1:9', 'Psalm 46:1', 'Proverbs 16:3', 'Isaiah 41:10'
      ];
      
      const ntVerses = [
        'John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Matthew 11:28',
        '1 Corinthians 13:4', 'Romans 12:2', 'Ephesians 2:8-9', '2 Timothy 1:7'
      ];
      
      // Handle HelloAO API versions with topic-based generation
      if (versionId.startsWith('helloao_')) {
        const actualVersionId = versionId.replace('helloao_', '');
        const topicKey = testament === 'OT' ? 'help-people' : 'commission';
        
        try {
          const result = await generateRandomByTopic(actualVersionId, topicKey);
          if (result.ok) {
            // Extract plain text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.html;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            
            return {
              id: `helloao-random-${Date.now()}`,
              text: plainText.trim(),
              reference: result.reference,
              testament,
              reason: `A meaningful ${testament === 'OT' ? 'Old Testament' : 'New Testament'} verse selected for ${topicKey === 'commission' ? 'encouragement and faith building' : 'comfort and guidance'}.`
            };
          }
        } catch (error) {
          console.warn('HelloAO random verse generation failed, falling back to popular verses:', error);
        }
      }
      
      const verses = testament === 'OT' ? otVerses : ntVerses;
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      
      // Use our secured Bible API endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          reference: randomVerse,
          version: versionId,
          action: 'getPassage'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch random verse: ${response.status}`);
      }
      
      const passage = await response.json();
      
      if (passage) {
        return {
          id: `random-${Date.now()}`,
          text: passage.text,
          reference: passage.reference,
          testament,
          reason: testament === 'OT' 
            ? "A foundational verse from the Old Testament that provides wisdom and encouragement."
            : "A powerful verse from the New Testament that reveals God's love and grace."
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get random verse:', error);
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
    
    const fallbackVerses: SearchResult[] = [
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