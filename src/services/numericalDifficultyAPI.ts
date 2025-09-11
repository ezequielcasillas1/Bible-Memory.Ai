/**
 * NUMERICAL DIFFICULTY API
 * 🎯 Advanced Fill-in-Blank Difficulty System with Numerical Scale
 * 
 * Features:
 * - Numerical scale: 2,4,6,8,10,15,20,30,45
 * - Verse recommendations for each difficulty level
 * - Smart word selection based on difficulty value
 * - Educational guidance for optimal practice
 */

export interface DifficultyLevel {
  value: number;
  name: string;
  description: string;
  emoji: string;
  recommendedVerses: string[];
  exampleVerses: string[];
  wordCountRange: string;
  targetAudience: string;
}

export interface DifficultyRecommendation {
  level: DifficultyLevel;
  wordsToBlank: number;
  selectionStrategy: 'first' | 'random' | 'meaningful' | 'strategic';
  explanation: string;
}

export class NumericalDifficultyAPI {
  private static readonly DIFFICULTY_LEVELS: Record<number, DifficultyLevel> = {
    2: {
      value: 2,
      name: 'Beginner',
      description: 'Perfect for starting your memorization journey',
      emoji: '🌱',
      recommendedVerses: ['Very short verses', 'Single phrases', 'Names of God'],
      exampleVerses: ['John 11:35 - "Jesus wept"', 'Psalm 46:10 - "Be still"'],
      wordCountRange: '2-4 words total',
      targetAudience: 'New memorizers, children'
    },
    4: {
      value: 4,
      name: 'Novice',
      description: 'Building confidence with simple verses',
      emoji: '🌿',
      recommendedVerses: ['Short promises', 'Simple commands', 'Basic truths'],
      exampleVerses: ['1 John 4:8 - "God is love"', 'Psalm 23:1 - "The Lord is my shepherd"'],
      wordCountRange: '4-8 words total',
      targetAudience: 'Beginners, young learners'
    },
    6: {
      value: 6,
      name: 'Elementary',
      description: 'Standard difficulty for common memory verses',
      emoji: '🌳',
      recommendedVerses: ['Popular memory verses', 'Comfort verses', 'Key promises'],
      exampleVerses: ['John 3:16', 'Philippians 4:13', 'Romans 8:28'],
      wordCountRange: '8-15 words total',
      targetAudience: 'Regular memorizers'
    },
    8: {
      value: 8,
      name: 'Intermediate',
      description: 'Moderate challenge for growing memorizers',
      emoji: '🌲',
      recommendedVerses: ['Longer promises', 'Doctrinal verses', 'Worship passages'],
      exampleVerses: ['Ephesians 2:8-9', 'Romans 12:1-2', 'Isaiah 40:31'],
      wordCountRange: '15-25 words total',
      targetAudience: 'Experienced memorizers'
    },
    10: {
      value: 10,
      name: 'Advanced',
      description: 'Solid challenge for dedicated students',
      emoji: '🏔️',
      recommendedVerses: ['Complex passages', 'Theological concepts', 'Prophetic verses'],
      exampleVerses: ['Romans 8:38-39', 'Hebrews 11:1', 'Isaiah 55:8-9'],
      wordCountRange: '25-35 words total',
      targetAudience: 'Committed memorizers'
    },
    15: {
      value: 15,
      name: 'Expert',
      description: 'Significant challenge requiring dedication',
      emoji: '⛰️',
      recommendedVerses: ['Extended passages', 'Psalm verses', 'Detailed instructions'],
      exampleVerses: ['Psalm 1', 'Matthew 5:3-12', '1 Corinthians 13:4-7'],
      wordCountRange: '35-50 words total',
      targetAudience: 'Advanced students'
    },
    20: {
      value: 20,
      name: 'Master',
      description: 'High difficulty for serious memorizers',
      emoji: '🗻',
      recommendedVerses: ['Long psalms', 'Extended teachings', 'Detailed narratives'],
      exampleVerses: ['Psalm 23 (full)', 'Matthew 6:9-13', 'Romans 12:9-21'],
      wordCountRange: '50-70 words total',
      targetAudience: 'Master memorizers'
    },
    30: {
      value: 30,
      name: 'Virtuoso',
      description: 'Extreme challenge for memory athletes',
      emoji: '🏔️',
      recommendedVerses: ['Very long passages', 'Complete chapters', 'Extended prophecies'],
      exampleVerses: ['Psalm 91', '1 Corinthians 13 (full)', 'Matthew 5:1-16'],
      wordCountRange: '70-90 words total',
      targetAudience: 'Memory champions'
    },
    45: {
      value: 45,
      name: 'Legendary',
      description: 'Ultimate challenge - longest verses in Scripture',
      emoji: '🌟',
      recommendedVerses: ['Longest Bible verses', 'Complex genealogies', 'Detailed laws'],
      exampleVerses: ['Esther 8:9 (90 words)', 'Psalm 119:176 (45 words)', '1 Chronicles 1:1-27'],
      wordCountRange: '90+ words total',
      targetAudience: 'Scripture memory legends'
    }
  };

  /**
   * Get difficulty level configuration
   */
  static getDifficultyLevel(value: number): DifficultyLevel | null {
    return this.DIFFICULTY_LEVELS[value] || null;
  }

  /**
   * Get all available difficulty levels
   */
  static getAllDifficultyLevels(): DifficultyLevel[] {
    return Object.values(this.DIFFICULTY_LEVELS);
  }

  /**
   * Get valid difficulty values
   */
  static getValidDifficultyValues(): number[] {
    return [2, 4, 6, 8, 10, 15, 20, 30, 45];
  }

  /**
   * Calculate words to blank based on difficulty level
   */
  static calculateWordsToBlank(verseText: string, difficulty: number): DifficultyRecommendation {
    const level = this.getDifficultyLevel(difficulty);
    if (!level) {
      throw new Error(`Invalid difficulty level: ${difficulty}`);
    }

    const words = verseText.split(' ');
    const totalWords = words.length;
    
    // For numerical difficulty, use the difficulty value directly as target blank count
    // But ensure it doesn't exceed reasonable limits
    let wordsToBlank = Math.min(difficulty, Math.floor(totalWords * 0.8)); // Max 80% of verse
    wordsToBlank = Math.max(wordsToBlank, 1); // Minimum 1 word
    
    // Determine selection strategy based on difficulty
    let selectionStrategy: 'first' | 'random' | 'meaningful' | 'strategic';
    let explanation: string;
    
    if (difficulty <= 6) {
      selectionStrategy = 'meaningful';
      explanation = `Select ${wordsToBlank} meaningful words (length > 3) for focused practice`;
    } else if (difficulty <= 15) {
      selectionStrategy = 'strategic';
      explanation = `Select ${wordsToBlank} key words strategically for balanced challenge`;
    } else {
      selectionStrategy = 'random';
      explanation = `Select ${wordsToBlank} words randomly for maximum difficulty`;
    }

    return {
      level,
      wordsToBlank,
      selectionStrategy,
      explanation
    };
  }

  /**
   * Select words for blanking based on difficulty recommendation
   */
  static selectWordsForDifficulty(verseText: string, difficulty: number): string[] {
    const recommendation = this.calculateWordsToBlank(verseText, difficulty);
    const words = verseText.split(' ');
    
    switch (recommendation.selectionStrategy) {
      case 'meaningful': {
        // Filter meaningful words (length > 3, not common words)
        const commonWords = new Set(['the', 'and', 'but', 'for', 'are', 'was', 'his', 'her', 'you', 'not']);
        const meaningfulWords = words
          .map((word, index) => ({ word: word.replace(/[.,!?;:"']/g, ''), originalWord: word, index }))
          .filter(({ word }) => word.length > 3 && !commonWords.has(word.toLowerCase()))
          .slice(0, recommendation.wordsToBlank);
        return meaningfulWords.map(({ originalWord }) => originalWord);
      }
      
      case 'strategic': {
        // Mix of meaningful words and key structural words
        const allWords = words.map(word => word.replace(/[.,!?;:"']/g, ''));
        const selectedIndices = new Set<number>();
        
        // First, select meaningful words
        const meaningfulIndices = allWords
          .map((word, index) => ({ word, index }))
          .filter(({ word }) => word.length > 3)
          .map(({ index }) => index)
          .slice(0, Math.floor(recommendation.wordsToBlank * 0.7));
        
        meaningfulIndices.forEach(index => selectedIndices.add(index));
        
        // Then add random words to reach target
        while (selectedIndices.size < recommendation.wordsToBlank && selectedIndices.size < words.length) {
          const randomIndex = Math.floor(Math.random() * words.length);
          selectedIndices.add(randomIndex);
        }
        
        return Array.from(selectedIndices)
          .sort((a, b) => a - b)
          .map(index => words[index]);
      }
      
      case 'random': {
        // Random selection for maximum challenge
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < recommendation.wordsToBlank && selectedIndices.size < words.length) {
          const randomIndex = Math.floor(Math.random() * words.length);
          selectedIndices.add(randomIndex);
        }
        return Array.from(selectedIndices)
          .sort((a, b) => a - b)
          .map(index => words[index]);
      }
      
      default: {
        // Fallback to first N words
        return words.slice(0, recommendation.wordsToBlank);
      }
    }
  }

  /**
   * Validate difficulty value
   */
  static isValidDifficulty(value: number): boolean {
    return this.getValidDifficultyValues().includes(value);
  }

  /**
   * Get recommended difficulty for verse length
   */
  static getRecommendedDifficulty(verseLength: number): number {
    if (verseLength <= 5) return 2;
    if (verseLength <= 10) return 4;
    if (verseLength <= 20) return 6;
    if (verseLength <= 30) return 8;
    if (verseLength <= 40) return 10;
    if (verseLength <= 60) return 15;
    if (verseLength <= 80) return 20;
    if (verseLength <= 100) return 30;
    return 45;
  }
}
