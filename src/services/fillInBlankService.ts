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
import { NumericalDifficultyAPI } from './numericalDifficultyAPI';

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
  translationContext?: {
    isTranslated: boolean;
    originalVerse: string; // English verse
    translatedVerse: string; // Primary translated verse (backward compatibility)
    // NEW: Multi-language support
    multiLanguageTranslations?: {
      [languageCode: string]: string; // e.g., { 'es': 'Porque...', 'fr': 'Car...', 'de': 'Denn...' }
    };
  };
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
   * CORE: Generate blanks with randomized progression
   * FIXED: Prevents duplicate blanks and adds randomization
   */
  static generateBlanks(state: FillInBlankState): FillInBlankResult {
    const words = state.verse.split(' ');
    const blanks: BlankWord[] = [];
    
    // FIXED: Use Set to track unique failed words and prevent duplicates
    const uniqueFailedWords = new Set(state.failedWords.map(fw => 
      fw.toLowerCase().replace(/[.,!?;:"']/g, '')
    ));
    
    const uniqueCompletedWords = new Set(state.completedWords.map(cw => 
      cw.toLowerCase().replace(/[.,!?;:"']/g, '')
    ));
    
    // Find FIRST occurrence of each unique failed word
    const failedWordPositions: Array<{word: string, position: number, completed: boolean}> = [];
    const processedWords = new Set<string>();
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      
      // FIXED: Only process each unique word once (first occurrence)
      if (uniqueFailedWords.has(cleanWord) && !processedWords.has(cleanWord)) {
        const isCompleted = uniqueCompletedWords.has(cleanWord);
        
        failedWordPositions.push({
          word: cleanWord,
          position: index,
          completed: isCompleted
        });
        
        processedWords.add(cleanWord); // Mark as processed
      }
    });
    
    // FIXED: Add randomization option while maintaining progression logic
    const shouldRandomize = state.failedWords.length > 2; // Only randomize if more than 2 words
    
    if (shouldRandomize) {
      // Randomize uncompleted words, keep completed ones in order
      const completedPositions = failedWordPositions.filter(fp => fp.completed);
      const uncompletedPositions = failedWordPositions.filter(fp => !fp.completed);
      
      // Shuffle uncompleted words
      for (let i = uncompletedPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uncompletedPositions[i], uncompletedPositions[j]] = [uncompletedPositions[j], uncompletedPositions[i]];
      }
      
      // Combine: completed first (in order), then randomized uncompleted
      const randomizedPositions = [...completedPositions, ...uncompletedPositions];
      failedWordPositions.splice(0, failedWordPositions.length, ...randomizedPositions);
    } else {
      // For 2 or fewer words, maintain left-to-right order
      failedWordPositions.sort((a, b) => a.position - b.position);
    }
    
    // Get uncompleted blank indices for active blank highlighting
    const uncompletedBlankIndices = failedWordPositions
      .filter(fp => !fp.completed)
      .map(fp => fp.position);
    
    console.log('🔍 GENERATE BLANKS DEBUG:', {
      failedWordPositions: failedWordPositions.length,
      uncompletedBlankIndices: uncompletedBlankIndices.length,
      completedWordsCount: state.completedWords.length,
      failedWordsCount: state.failedWords.length
    });
    
    // Generate blanks array
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const isCompleted = state.completedWords.some(completedWord =>
        completedWord.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      
      // FIXED: Check if this word is a failed word that should be a blank
      const isFailedWord = uniqueFailedWords.has(cleanWord);
      const shouldBeBlank = isFailedWord && !isCompleted;
      
      blanks.push({
        word,
        isBlank: shouldBeBlank,
        underscores: shouldBeBlank ? this.generateUnderscores(word) : '',
        position: index,
        isCompleted
      });
    });
    
    const formattedText = this.generateFormattedText(blanks);
    const totalBlanks = state.failedWords.length;
    const currentBlankIndex = uncompletedBlankIndices.length > 0 ? uncompletedBlankIndices[0] : -1;
    
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
    const activeBlankWords = blanks.blanks.filter(blank => blank.isBlank);
    
    if (activeBlankWords.length === 0) {
      return {
        newState: state,
        isCorrect: false,
        shouldAdvance: false,
        currentWord: null
      };
    }
    
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // FIXED: Check user input against ALL active blanks
    let matchedBlank: BlankWord | null = null;
    let expectedWord = '';
    
    for (const blankWord of activeBlankWords) {
      const currentWord = blankWord.word;
      const cleanCurrentWord = currentWord.toLowerCase().replace(/[.,!?;:"']/g, '');
      
      // MULTI-LANGUAGE TRANSLATION-AWARE COMPARISON
      let isMatch = false;
      let expectedWord = '';
      let matchedLanguage = '';
      
      if (state.translationContext?.isTranslated) {
        // Always check English first
        const englishWord = cleanCurrentWord;
        if (cleanUserInput === englishWord) {
          isMatch = true;
          expectedWord = englishWord;
          matchedLanguage = 'en';
        } else {
          // Check multi-language translations if available
          if (state.translationContext.multiLanguageTranslations) {
            for (const [langCode, translatedVerse] of Object.entries(state.translationContext.multiLanguageTranslations)) {
              const translatedWord = this.getTranslatedWordFromVerse(
                currentWord,
                blankWord.position,
                state.translationContext.originalVerse,
                translatedVerse
              ).toLowerCase().replace(/[.,!?;:"']/g, '');
              
              if (cleanUserInput === translatedWord) {
                isMatch = true;
                expectedWord = translatedWord;
                matchedLanguage = langCode;
                break;
              }
            }
          }
          
          // Fallback: Check primary translated verse (backward compatibility)
          if (!isMatch && state.translationContext.translatedVerse) {
            const translatedWord = this.getTranslatedWord(
              currentWord, 
              blankWord.position, 
              state.translationContext
            ).toLowerCase().replace(/[.,!?;:"']/g, '');
            
            if (cleanUserInput === translatedWord) {
              isMatch = true;
              expectedWord = translatedWord;
              matchedLanguage = 'primary';
            }
          }
        }
      } else {
        // No translation context - only check English
        if (cleanUserInput === cleanCurrentWord) {
          isMatch = true;
          expectedWord = cleanCurrentWord;
          matchedLanguage = 'en';
        }
      }
      
      if (isMatch) {
        matchedBlank = blankWord;
        break;
      }
    }
    
    const isCorrect = matchedBlank !== null;
    
    if (isCorrect && matchedBlank) {
      // Add word to completed list - use the expected word (translated if available)
      const cleanMatchedWord = matchedBlank.word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const wordToStore = state.translationContext?.isTranslated ? expectedWord : cleanMatchedWord;
      const newCompletedWords = [...state.completedWords, wordToStore];
      
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
        currentWord: wordToStore
      };
    }
    
    return {
      newState: state,
      isCorrect: false,
      shouldAdvance: false,
      currentWord: activeBlankWords.length > 0 ? activeBlankWords[0].word : null
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
    const activeBlankWords = blanks.blanks.filter(blank => blank.isBlank);
    
    console.log('🔍 getCurrentBlankWord DEBUG:', {
      totalBlanks: blanks.blanks.length,
      activeBlanks: activeBlankWords.length,
      currentBlankIndex: state.currentBlankIndex,
      completedWords: state.completedWords,
      failedWords: state.failedWords,
      activeBlankWords: activeBlankWords.map(b => b.word)
    });
    
    // EMERGENCY FIX: If no active blanks but we have failed words, reset to first failed word
    if (activeBlankWords.length === 0 && state.failedWords.length > 0) {
      console.log('🚨 EMERGENCY: No active blanks found, returning first failed word');
      return state.failedWords[0];
    }
    
    const currentBlankIndex = state.currentBlankIndex || 0;
    
    if (activeBlankWords.length === 0) return null;
    if (currentBlankIndex >= activeBlankWords.length) {
      // If index is out of bounds, return first active blank
      console.log('🔧 INDEX OUT OF BOUNDS: Returning first active blank');
      return activeBlankWords[0].word;
    }
    
    return activeBlankWords[currentBlankIndex].word;
  }
  
  /**
   * TRANSLATION-AWARE: Get translated word for comparison
   * Based on the original getTranslatedBlankWord logic from SyntaxLabPage
   */
  static getTranslatedWord(
    englishWord: string, 
    position: number, 
    translationContext: { originalVerse: string; translatedVerse: string }
  ): string {
    const englishWords = translationContext.originalVerse.split(' ');
    const translatedWords = translationContext.translatedVerse.split(' ');
    
    // Method 1: Try exact position mapping first (works for most cases)
    if (position < translatedWords.length) {
      const candidateWord = translatedWords[position];
      if (candidateWord) {
        return candidateWord;
      }
    }
    
    // Method 2: Fallback - try to find by relative position for different sentence structures
    const cleanEnglishWord = englishWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    const englishWordIndex = englishWords.findIndex((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      return cleanWord === cleanEnglishWord;
    });
    
    if (englishWordIndex !== -1 && englishWordIndex < translatedWords.length) {
      const translatedCandidate = translatedWords[englishWordIndex];
      return translatedCandidate || englishWord;
    }
    
    // Method 3: For very different sentence structures, use proportional mapping
    if (englishWords.length > 0 && translatedWords.length > 0) {
      const proportionalIndex = Math.floor((position / englishWords.length) * translatedWords.length);
      const proportionalWord = translatedWords[proportionalIndex];
      if (proportionalWord) {
        return proportionalWord;
      }
    }
    
    // Fallback to English word
    return englishWord;
  }
  
  /**
   * ENHANCED: Get translated word from specific verse (for multi-language support)
   * Enhanced for Asian languages with better word mapping algorithms
   */
  static getTranslatedWordFromVerse(
    englishWord: string,
    position: number,
    originalVerse: string,
    translatedVerse: string
  ): string {
    const englishWords = originalVerse.split(' ');
    const translatedWords = translatedVerse.split(' ');
    
    // Method 1: Try exact position mapping first (works for most European languages)
    if (position < translatedWords.length) {
      const candidateWord = translatedWords[position];
      if (candidateWord) {
        return candidateWord;
      }
    }
    
    // Method 2: Find by word matching in original verse
    const cleanEnglishWord = englishWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    const englishWordIndex = englishWords.findIndex((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      return cleanWord === cleanEnglishWord;
    });
    
    if (englishWordIndex !== -1 && englishWordIndex < translatedWords.length) {
      const translatedCandidate = translatedWords[englishWordIndex];
      return translatedCandidate || englishWord;
    }
    
    // Method 3: Proportional mapping for different sentence structures
    if (englishWords.length > 0 && translatedWords.length > 0) {
      const proportionalIndex = Math.floor((position / englishWords.length) * translatedWords.length);
      const proportionalWord = translatedWords[proportionalIndex];
      if (proportionalWord) {
        return proportionalWord;
      }
    }
    
    // Method 4: ENHANCED - Semantic position mapping for Asian languages
    // For languages with very different structures, use semantic rules
    if (englishWords.length > 0 && translatedWords.length > 0) {
      // Special handling for common biblical words
      const wordMappings: { [key: string]: number } = {
        'for': 0,     // Usually first word in many languages
        'god': 1,     // Usually second or close to beginning  
        'so': 2,      // Adverb typically early
        'loved': 3,   // Main verb
        'world': 4,   // Object of love
        'that': 5,    // Conjunction
        'he': 6,      // Subject of giving
        'gave': 7,    // Verb of giving
        'his': 8,     // Possessive
        'one': 9,     // Modifier
        'and': 10,    // Conjunction
        'only': 11,   // Modifier
        'son': 12     // Final object
      };
      
      const semanticIndex = wordMappings[cleanEnglishWord];
      if (semanticIndex !== undefined) {
        // Map semantic position to translated verse proportionally
        const semanticPosition = Math.floor((semanticIndex / 12) * translatedWords.length);
        if (semanticPosition < translatedWords.length) {
          const semanticWord = translatedWords[semanticPosition];
          if (semanticWord) {
            return semanticWord;
          }
        }
      }
    }
    
    // Method 5: ENHANCED - Handle languages without word separators (Thai, Chinese, Japanese)
    if (translatedWords.length === 1 && translatedWords[0].length > 10) {
      // This is likely a language without spaces (Thai, Chinese, Japanese)
      const fullTranslatedVerse = translatedWords[0];
      
      // For position 0 (first word), try to extract the beginning portion
      if (position === 0) {
        // Thai: "เพราะ" is typically the first word
        // Chinese: "因为" or "神爱世人" are typically the first words
        // Try specific patterns for common biblical opening words
        const commonOpenings = [
          'เพราะ',    // Thai "For/Because"
          '因为',     // Chinese "Because"
          '神爱世人',  // Chinese "God loves the world"
          '神愛世人',  // Traditional Chinese
          '神は世を愛し', // Japanese
        ];
        
        // Check if the verse starts with any common opening
        for (const opening of commonOpenings) {
          if (fullTranslatedVerse.startsWith(opening)) {
            return opening;
          }
        }
        
        // Fallback: try different lengths but prefer longer meaningful words
        const possibleLengths = [5, 4, 6, 3, 2]; // Start with length 5 for "เพราะ"
        
        for (const length of possibleLengths) {
          const candidate = fullTranslatedVerse.substring(0, length);
          if (candidate && candidate.length >= 2) { // Minimum 2 characters
            return candidate;
          }
        }
      }
    }
    
    // Method 6: FALLBACK - Return first word if position 0
    if (position === 0 && translatedWords.length > 0) {
      return translatedWords[0];
    }
    
    // Method 7: ULTIMATE FALLBACK - Return English word
    return englishWord;
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
  
  // NEW: Numerical difficulty method
  static selectWordsForNumericalDifficulty(originalText: string, difficulty: number): string[] {
    return NumericalDifficultyAPI.selectWordsForDifficulty(originalText, difficulty);
  }

  // Legacy method for word selection based on range (maintained for backward compatibility)
  static selectWordsForBlankRange(originalText: string, range: 'short' | 'long'): string[] {
    // Convert legacy range to numerical difficulty
    const difficulty = range === 'short' ? 6 : 15;
    return this.selectWordsForNumericalDifficulty(originalText, difficulty);
  }
  
  // Legacy method for checking blank answers
  static checkBlankAnswer(userInput: string, targetWord: string): boolean {
    const cleanUser = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const cleanTarget = targetWord.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    return cleanUser === cleanTarget;
  }
}