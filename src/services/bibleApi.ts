// Scripture API Bible Service
// Using api.scripture.api.bible with API key

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
  private static readonly BASE_URL = '/api/scripture';
  private static readonly API_KEY = '6d078a413735440025d1f98883a8d372';

  // Bible version mappings
  private static readonly VERSION_MAP: Record<string, string> = {
    'KJV': 'de4e12af7f28f599-02', // King James Version
    'NKJV': '114c1c8e0c8669e4-01', // New King James Version
    'NLT': '71c6eab17ae5b667-01', // New Living Translation
    'ESV': '06125adad2d5898a-01', // English Standard Version
    'ASV': '685d1470fe4d5c3b-01'  // American Standard Version
  };

  private static getHeaders() {
    return {
      'accept': 'application/json',
      'api-key': this.API_KEY
    };
  }

  private static getBibleId(version: string = 'ESV'): string {
    return this.VERSION_MAP[version] || this.VERSION_MAP['ESV'];
  }

  // Get a specific verse by reference
  static async getVerse(reference: string, version?: string): Promise<BibleVerse> {
    try {
      const bibleId = this.getBibleId(version);
      
      // First, search for the passage to get the correct passage ID
      const searchUrl = `${this.BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}&limit=1`;
      const searchResponse = await fetch(searchUrl, {
        headers: this.getHeaders()
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.data?.passages || searchData.data.passages.length === 0) {
        // Fallback: try to construct passage ID from reference
        const passageId = this.constructPassageId(reference);
        return await this.getPassageById(bibleId, passageId, reference, version);
      }
      
      const passage = searchData.data.passages[0];
      const passageUrl = `${this.BASE_URL}/bibles/${bibleId}/passages/${passage.id}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
      
      const passageResponse = await fetch(passageUrl, {
        headers: this.getHeaders()
      });
      
      if (!passageResponse.ok) {
        throw new Error(`Passage fetch failed: ${passageResponse.statusText}`);
      }
      
      const passageData = await passageResponse.json();
      
      return this.convertToStandardFormat(passageData.data, reference, version);
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  }

  private static async getPassageById(bibleId: string, passageId: string, reference: string, version?: string): Promise<BibleVerse> {
    const passageUrl = `${this.BASE_URL}/bibles/${bibleId}/passages/${passageId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
    
    const response = await fetch(passageUrl, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Passage fetch failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return this.convertToStandardFormat(data.data, reference, version);
  }

  private static constructPassageId(reference: string): string {
    // Convert "John 3:16" to passage ID format
    const parts = reference.match(/^(\d?\s?\w+)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (!parts) return reference;
    
    const [, book, chapter, startVerse, endVerse] = parts;
    const bookAbbrev = this.getBookAbbreviation(book.trim());
    
    if (endVerse) {
      return `${bookAbbrev}.${chapter}.${startVerse}-${bookAbbrev}.${chapter}.${endVerse}`;
    } else {
      return `${bookAbbrev}.${chapter}.${startVerse}`;
    }
  }

  private static getBookAbbreviation(bookName: string): string {
    const bookMap: Record<string, string> = {
      'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
      'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
      '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
      'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
      'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
      'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
      'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
      'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
      'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
      'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
      'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
      'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
      '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
      'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
      '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
    };
    
    return bookMap[bookName] || bookName.substring(0, 3).toUpperCase();
  }

  private static convertToStandardFormat(passageData: any, reference: string, version?: string): BibleVerse {
    const text = passageData.content?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';
    
    // Parse reference to extract book, chapter, verse info
    const refParts = reference.match(/^(\d?\s?\w+)\s+(\d+):(\d+)(?:-(\d+))?/);
    const bookName = refParts?.[1]?.trim() || 'Unknown';
    const chapter = parseInt(refParts?.[2] || '1');
    const verse = parseInt(refParts?.[3] || '1');
    
    return {
      reference,
      verses: [{
        book_id: this.getBookAbbreviation(bookName),
        book_name: bookName,
        chapter,
        verse,
        text
      }],
      text,
      translation_id: version || 'ESV',
      translation_name: this.getVersionName(version || 'ESV'),
      translation_note: ''
    };
  }

  private static getVersionName(version: string): string {
    const versionNames: Record<string, string> = {
      'KJV': 'King James Version',
      'NKJV': 'New King James Version',
      'NLT': 'New Living Translation',
      'ESV': 'English Standard Version',
      'ASV': 'American Standard Version'
    };
    return versionNames[version] || version;
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

  // Get a random verse from a predefined list
  static async getRandomVerse(type: 'commission' | 'help' = 'commission', version?: string): Promise<BibleVerse> {
    const commissionVerses = [
      'John 3:16', 'Romans 6:23', 'Romans 10:9', 'Ephesians 2:8-9', 'John 14:6',
      '2 Corinthians 5:17', 'Romans 5:8', 'John 1:12', 'Acts 16:31', 'Romans 3:23',
      'Isaiah 53:6', 'Jeremiah 29:11', 'Psalm 23:1', 'Proverbs 3:5-6', '1 John 1:9',
      'Philippians 4:13', 'Isaiah 41:10', 'Matthew 11:28', 'John 10:10', 'Romans 8:28'
    ];

    const helpVerses = [
      'Psalm 23:4', 'Isaiah 41:10', 'Philippians 4:13', 'Matthew 11:28-30', 'Psalm 55:22',
      '1 Peter 5:7', 'Joshua 1:9', 'Psalm 46:1', 'Isaiah 40:31', 'Psalm 34:18',
      'Romans 8:28', 'Jeremiah 29:11', 'Psalm 121:1-2', 'Deuteronomy 31:6', 'Psalm 27:1',
      'Isaiah 26:3', 'Philippians 4:19', 'Psalm 91:1-2', 'Hebrews 13:5', '2 Corinthians 12:9'
    ];

    const verses = type === 'commission' ? commissionVerses : helpVerses;
    const randomIndex = Math.floor(Math.random() * verses.length);
    const selectedReference = verses[randomIndex];

    return await this.getVerse(selectedReference, version);
  }

  // Get a full chapter
  static async getChapter(book: string, chapter: number, version?: string): Promise<BibleVerse> {
    try {
      const bibleId = this.getBibleId(version);
      const bookId = this.getBookAbbreviation(book);
      const chapterId = `${bookId}.${chapter}`;
      
      const chapterUrl = `${this.BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
      
      const response = await fetch(chapterUrl, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Chapter fetch failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Parse the chapter content to extract individual verses
      const content = data.data.content || '';
      const verses = this.parseChapterVerses(content, book, chapter);
      
      return {
        reference: `${book} ${chapter}`,
        verses,
        text: content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        translation_id: version || 'ESV',
        translation_name: this.getVersionName(version || 'ESV'),
        translation_note: ''
      };
    } catch (error) {
      console.error('Error fetching chapter:', error);
      throw error;
    }
  }

  private static parseChapterVerses(content: string, book: string, chapter: number): Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }> {
    const verses: Array<{
      book_id: string;
      book_name: string;
      chapter: number;
      verse: number;
      text: string;
    }> = [];
    
    // Remove HTML tags and split by verse numbers
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const verseMatches = cleanContent.match(/(\d+)\s+([^0-9]+?)(?=\d+\s+|$)/g);
    
    if (verseMatches) {
      verseMatches.forEach(match => {
        const verseMatch = match.match(/^(\d+)\s+(.+)$/);
        if (verseMatch) {
          const verseNumber = parseInt(verseMatch[1]);
          const verseText = verseMatch[2].trim();
          
          verses.push({
            book_id: this.getBookAbbreviation(book),
            book_name: book,
            chapter,
            verse: verseNumber,
            text: verseText
          });
        }
      });
    }
    
    return verses;
  }

  // Get list of books
  static async getBooks(version?: string): Promise<BibleBook[]> {
    try {
      const bibleId = this.getBibleId(version);
      const booksUrl = `${this.BASE_URL}/bibles/${bibleId}/books`;
      
      const response = await fetch(booksUrl, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Books fetch failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.data.map((book: any) => ({
        id: book.id,
        name: book.name,
        testament: book.id.match(/^(GEN|EXO|LEV|NUM|DEU|JOS|JDG|RUT|1SA|2SA|1KI|2KI|1CH|2CH|EZR|NEH|EST|JOB|PSA|PRO|ECC|SNG|ISA|JER|LAM|EZK|DAN|HOS|JOL|AMO|OBA|JON|MIC|NAM|HAB|ZEP|HAG|ZEC|MAL)/) ? 'old' : 'new'
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      // Return default book list if API fails
      return this.getDefaultBooks();
    }
  }

  private static getDefaultBooks(): BibleBook[] {
    const oldTestament = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ];

    const newTestament = [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
      'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];

    return [
      ...oldTestament.map((name, index) => ({ id: this.getBookAbbreviation(name), name, testament: 'old' as const })),
      ...newTestament.map((name, index) => ({ id: this.getBookAbbreviation(name), name, testament: 'new' as const }))
    ];
  }

  // Search for verses containing specific text
  static async searchVerses(query: string, limit: number = 10, version?: string): Promise<BibleVerse[]> {
    try {
      const bibleId = this.getBibleId(version);
      const searchUrl = `${this.BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(searchUrl, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data?.passages) {
        return [];
      }
      
      const results: BibleVerse[] = [];
      
      for (const passage of data.data.passages) {
        try {
          const passageUrl = `${this.BASE_URL}/bibles/${bibleId}/passages/${passage.id}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
          
          const passageResponse = await fetch(passageUrl, {
            headers: this.getHeaders()
          });
          
          if (passageResponse.ok) {
            const passageData = await passageResponse.json();
            results.push(this.convertToStandardFormat(passageData.data, passage.reference, version));
          }
        } catch (error) {
          console.error('Error fetching search result passage:', error);
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