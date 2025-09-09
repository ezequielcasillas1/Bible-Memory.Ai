/**
 * NEW FILL-IN-BLANK API
 * Purpose: Create Fill in the Blank API that uses prior information from syntax memoized verses
 * Based on memorized results, generate SyntaxLabs study flows
 * 
 * Core Logic:
 * - Pull results from verse memorization
 * - If the user failed a word, capture it
 * - Those failed words become the blanks in Fill in the Blank practice
 * - Progress follows top-to-bottom, left-to-right order of the verse
 */

import { ComparisonResult, WordComparison } from './verseComparisonService';

export interface BlankWord {
  word: string;
  isBlank: boolean;
  underscores: string;
  position: number;
  isCompleted: boolean; // NEW: Track completion state
}

export interface FillInBlankResult {
  blanks: BlankWord[];
  formattedText: string;
  totalBlanks: number;
  currentBlankIndex: number; // NEW: Current active blank (left-to-right progression)
}

export interface FillInBlankState {
  verse: string;
  failedWords: string[]; // Words that failed in memorization
  completedWords: string[]; // Words successfully filled in
  currentBlankIndex: number; // Current active blank position
}

export class FillInBlankAPI {
  
  /**
   * CORE: Extract failed words from memorization results
   * Based on ComparisonResult from VerseComparisonService
   */
  static extractFailedWords(comparisonResult: ComparisonResult): string[] {
    const failedWords: string[] = [];
    
    // Extract words that failed from userComparison
    comparisonResult.userComparison.forEach(wordComp => {
      if (wordComp.status === 'incorrect' || wordComp.status === 'extra') {
        if (wordComp.originalWord) {
          failedWords.push(wordComp.originalWord);
        }
      }
    });
    
    // Extract missing words from originalComparison
    comparisonResult.originalComparison.forEach(wordComp => {
      if (wordComp.status === 'missing') {
        failedWords.push(wordComp.originalWord);
      }
    });
    
    // Remove duplicates and return
    return Array.from(new Set(failedWords));
  }
  
  /**
   * CORE: Create initial fill-in-blank state from memorization results
   */
  static createFillInBlankState(verseText: string, comparisonResult: ComparisonResult): FillInBlankState {
    const failedWords = this.extractFailedWords(comparisonResult);
    
    return {
      verse: verseText,
      failedWords,
      completedWords: [],
      currentBlankIndex: 0
    };
  }
  
  /**
   * CORE: Generate blanks with left-to-right progression
   * Only shows ONE blank at a time (leftmost uncompleted failed word)
   */
  static generateBlanks(state: FillInBlankState): FillInBlankResult {
    const words = state.verse.split(' ');
    const blanks: BlankWord[] = [];
    
    // Find positions of all failed words in verse order
    const failedWordPositions: Array<{word: string, position: number, completed: boolean}> = [];
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const isFailedWord = state.failedWords.some(failedWord => 
        failedWord.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      
      if (isFailedWord) {
        const isCompleted = state.completedWords.some(completedWord =>
          completedWord.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
        );
        
        failedWordPositions.push({
          word: cleanWord,
          position: index,
          completed: isCompleted
        });
      }
    });
    
    // Sort by position to ensure left-to-right order
    failedWordPositions.sort((a, b) => a.position - b.position);
    
    // Find the leftmost uncompleted failed word
    const currentBlankPosition = failedWordPositions.find(fp => !fp.completed);
    const currentBlankIndex = currentBlankPosition ? currentBlankPosition.position : -1;
    
    // Generate blanks array
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const isCompleted = state.completedWords.some(completedWord =>
        completedWord.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      
      // Only blank the current leftmost uncompleted failed word
      const isCurrentBlank = index === currentBlankIndex;
      
      blanks.push({
        word,
        isBlank: isCurrentBlank,
        underscores: isCurrentBlank ? this.generateUnderscores(word) : '',
        position: index,
        isCompleted
      });
    });
    
    const formattedText = this.generateFormattedText(blanks);
    const totalBlanks = state.failedWords.length;
    
    return {
      blanks,
      formattedText,
      totalBlanks,
      currentBlankIndex
    };
  }
  
  /**
   * CORE: Process word submission and update state
   * Returns updated state and whether to advance to next blank
   */
  static processWordSubmission(
    state: FillInBlankState, 
    userInput: string
  ): { 
    newState: FillInBlankState, 
    isCorrect: boolean, 
    shouldAdvance: boolean,
    currentWord: string | null
  } {
    const blanks = this.generateBlanks(state);
    const currentBlank = blanks.blanks.find(blank => blank.isBlank);
    
    if (!currentBlank) {
      return {
        newState: state,
        isCorrect: false,
        shouldAdvance: false,
        currentWord: null
      };
    }
    
    const currentWord = currentBlank.word;
    const cleanCurrentWord = currentWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    const isCorrect = cleanUserInput === cleanCurrentWord;
    
    if (isCorrect) {
      // Add word to completed list
      const newCompletedWords = [...state.completedWords, cleanCurrentWord];
      
      // Check if this word already exists to prevent duplicates
      const uniqueCompletedWords = Array.from(new Set(newCompletedWords));
      
      const newState: FillInBlankState = {
        ...state,
        completedWords: uniqueCompletedWords,
        currentBlankIndex: state.currentBlankIndex + 1
      };
      
      return {
        newState,
        isCorrect: true,
        shouldAdvance: true,
        currentWord: cleanCurrentWord
      };
    }
    
    return {
      newState: state,
      isCorrect: false,
      shouldAdvance: false,
      currentWord: cleanCurrentWord
    };
  }
  
  /**
   * Check if all blanks are completed
   */
  static isCompleted(state: FillInBlankState): boolean {
    return state.completedWords.length >= state.failedWords.length;
  }
  
  /**
   * Get current blank word for display
   */
  static getCurrentBlankWord(state: FillInBlankState): string | null {
    const blanks = this.generateBlanks(state);
    const currentBlank = blanks.blanks.find(blank => blank.isBlank);
    return currentBlank ? currentBlank.word : null;
  }
  
  /**
   * Generate underscores for blank display
   */
  static generateUnderscores(word: string): string {
    const cleanWord = word.replace(/[.,!?;:"']/g, '');
    const length = cleanWord.length;
    
    let underscoreCount;
    if (length <= 3) {
      underscoreCount = 3;
    } else if (length <= 6) {
      underscoreCount = length;
    } else if (length <= 10) {
      underscoreCount = Math.min(8, length);
    } else {
      underscoreCount = 10;
    }
    
    return '_'.repeat(underscoreCount);
  }
  
  /**
   * Generate formatted text for display
   */
  static generateFormattedText(blanks: BlankWord[]): string {
    const CHARS_PER_LINE = 35;
    let currentLine = '';
    const result: string[] = [];
    
    blanks.forEach((blankWord, index) => {
      const wordToAdd = blankWord.isBlank ? blankWord.underscores : blankWord.word;
      const wordWithSpace = index === 0 ? wordToAdd : ` ${wordToAdd}`;
      
      if (currentLine.length + wordWithSpace.length > CHARS_PER_LINE && currentLine.length > 0) {
        result.push(currentLine);
        currentLine = wordToAdd;
      } else {
        currentLine += wordWithSpace;
      }
    });
    
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    
    return result.join('\n');
  }
}

// Keep legacy exports for compatibility during transition
export class FillInBlankService extends FillInBlankAPI {
  // Legacy methods that delegate to new API
  static calculateProgressiveFillInBlanks(
    originalText: string,
    wrongWords: string[],
    completedWords: string[] = [],
    translationMapping?: {englishText: string, englishWrongWords: string[]}
  ): FillInBlankResult {
    // Create a mock ComparisonResult for legacy compatibility
    const mockComparison: ComparisonResult = {
      accuracy: 0,
      totalWords: wrongWords.length,
      correctWords: 0,
      incorrectWords: wrongWords.length,
      missingWords: 0,
      extraWords: 0,
      userComparison: wrongWords.map(word => ({
        userWord: '',
        originalWord: word,
        status: 'incorrect' as const,
        position: 0
      })),
      originalComparison: wrongWords.map(word => ({
        userWord: '',
        originalWord: word,
        status: 'incorrect' as const,
        position: 0
      })),
      detailedFeedback: 'Legacy compatibility mode'
    };
    
    const state = FillInBlankAPI.createFillInBlankState(originalText, mockComparison);
    state.completedWords = completedWords;
    
    return FillInBlankAPI.generateBlanks(state);
  }
  
  // Legacy method for basic fill-in-blank calculation
  static calculateFillInBlanks(originalText: string, wrongWords: string[]): FillInBlankResult {
    return this.calculateProgressiveFillInBlanks(originalText, wrongWords, []);
  }
  
  // Legacy method for word selection based on range
  static selectWordsForBlankRange(originalText: string, range: 'short' | 'long'): string[] {
    const words = originalText.split(' ');
    const meaningfulWords = words.filter(word => word.length > 3);
    
    let targetCount: number;
    if (range === 'short') {
      targetCount = Math.max(3, Math.floor(meaningfulWords.length * 0.3));
    } else {
      targetCount = Math.max(6, Math.floor(meaningfulWords.length * 0.6));
    }
    
    // Simple selection - just take first N meaningful words
    return meaningfulWords.slice(0, targetCount);
  }
  
  // Legacy method for checking blank answers
  static checkBlankAnswer(userInput: string, targetWord: string): boolean {
    const cleanUser = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const cleanTarget = targetWord.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    return cleanUser === cleanTarget;
  }
}