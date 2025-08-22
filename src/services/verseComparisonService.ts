interface WordComparison {
  userWord: string;
  originalWord: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  position: number;
  suggestion?: string;
}

interface ComparisonResult {
  accuracy: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  missingWords: number;
  extraWords: number;
  userComparison: WordComparison[];
  originalComparison: WordComparison[];
  detailedFeedback: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class VerseComparisonService {
  static async compareVerses(
    userInput: string, 
    originalVerse: string, 
    bibleVersion: string
  ): Promise<ComparisonResult> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verse-comparison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          userInput, 
          originalVerse, 
          bibleVersion 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare verses');
      }

      return await response.json();
    } catch (error) {
      console.error('Verse comparison failed:', error);
      // Fallback to simple comparison
      return this.fallbackComparison(userInput, originalVerse, bibleVersion);
    }
  }

  private static fallbackComparison(
    userInput: string, 
    originalVerse: string, 
    bibleVersion: string
  ): ComparisonResult {
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

    const userWords = normalizeText(userInput).split(' ');
    const originalWords = normalizeText(originalVerse).split(' ');
    
    let correct = 0;
    const userComparison: WordComparison[] = [];
    const originalComparison: WordComparison[] = [];

    // Simple word-by-word comparison
    const maxLength = Math.max(userWords.length, originalWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      const userWord = userWords[i] || '';
      const originalWord = originalWords[i] || '';

      if (userWord && originalWord) {
        if (userWord === originalWord) {
          userComparison.push({
            userWord,
            originalWord,
            status: 'correct',
            position: i
          });
          originalComparison.push({
            userWord,
            originalWord,
            status: 'correct',
            position: i
          });
          correct++;
        } else {
          userComparison.push({
            userWord,
            originalWord,
            status: 'incorrect',
            position: i,
            suggestion: `Should be "${originalWord}"`
          });
          originalComparison.push({
            userWord,
            originalWord,
            status: 'incorrect',
            position: i,
            suggestion: `You wrote "${userWord}"`
          });
        }
      } else if (userWord && !originalWord) {
        userComparison.push({
          userWord,
          originalWord: '',
          status: 'extra',
          position: i,
          suggestion: 'This word should be removed'
        });
      } else if (!userWord && originalWord) {
        originalComparison.push({
          userWord: '',
          originalWord,
          status: 'missing',
          position: i,
          suggestion: 'This word was missing from your answer'
        });
      }
    }

    const accuracy = originalWords.length > 0 ? Math.round((correct / originalWords.length) * 100) : 0;

    return {
      accuracy,
      totalWords: originalWords.length,
      correctWords: correct,
      incorrectWords: userComparison.filter(w => w.status === 'incorrect').length,
      missingWords: originalComparison.filter(w => w.status === 'missing').length,
      extraWords: userComparison.filter(w => w.status === 'extra').length,
      userComparison,
      originalComparison,
      detailedFeedback: `Simple comparison completed for ${bibleVersion || 'your Bible version'}.`
    };
  }
}

export type { WordComparison, ComparisonResult };