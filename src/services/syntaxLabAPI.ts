import { ComparisonResult } from '../types';
import { FillInBlankAPI, FillInBlankService, type FillInBlankResult, type FillInBlankState } from './fillInBlankService';
import { GrammarValidationAPI } from './grammarValidationAPI';
import { OriginalVerseService } from './originalVerseService';

export interface SyntaxLabSessionData {
  id: string;
  verseText: string;
  verseReference: string;
  wrongWords: string[];
  fillInBlankResult?: FillInBlankResult;
  fillInBlankState?: FillInBlankState; // NEW: Track fill-in-blank state
  originalVerseText: string;
  createdAt: Date;
}

export class SyntaxLabAPI {
  static createSession(comparisonResult: ComparisonResult): SyntaxLabSessionData {
    const { originalText, wrongWords } = OriginalVerseService.extractOriginalVerse(comparisonResult);
    const cleanOriginalText = OriginalVerseService.getCleanOriginalVerse(comparisonResult);
    const wordsToFix = OriginalVerseService.getWordsToFix(comparisonResult);
    
    // NEW API: Create fill-in-blank state from memorization results
    const fillInBlankState = FillInBlankAPI.createFillInBlankState(cleanOriginalText, comparisonResult);
    const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);
    
    return {
      id: `syntax-lab-${Date.now()}`,
      verseText: cleanOriginalText,
      verseReference: `${comparisonResult.originalComparison[0]?.verse || 'Unknown'}`,
      wrongWords: wordsToFix,
      fillInBlankResult,
      fillInBlankState, // NEW: Include state for progression tracking
      originalVerseText: cleanOriginalText,
      createdAt: new Date()
    };
  }

  /**
   * NEW API: Process word submission and update session state
   */
  static processWordSubmission(
    sessionData: SyntaxLabSessionData, 
    userInput: string
  ): {
    updatedSession: SyntaxLabSessionData,
    isCorrect: boolean,
    shouldAdvance: boolean,
    currentWord: string | null
  } {
    if (!sessionData.fillInBlankState) {
      throw new Error('Session missing fill-in-blank state');
    }
    
    const result = FillInBlankAPI.processWordSubmission(sessionData.fillInBlankState, userInput);
    const updatedBlanks = FillInBlankAPI.generateBlanks(result.newState);
    
    const updatedSession: SyntaxLabSessionData = {
      ...sessionData,
      fillInBlankState: result.newState,
      fillInBlankResult: updatedBlanks
    };
    
    return {
      updatedSession,
      isCorrect: result.isCorrect,
      shouldAdvance: result.shouldAdvance,
      currentWord: result.currentWord
    };
  }
  
  /**
   * Check if fill-in-blank session is completed
   */
  static isSessionCompleted(sessionData: SyntaxLabSessionData): boolean {
    if (!sessionData.fillInBlankState) return false;
    return FillInBlankAPI.isCompleted(sessionData.fillInBlankState);
  }
  
  /**
   * Get current blank word
   */
  static getCurrentBlankWord(sessionData: SyntaxLabSessionData): string | null {
    if (!sessionData.fillInBlankState) return null;
    return FillInBlankAPI.getCurrentBlankWord(sessionData.fillInBlankState);
  }

  static async validateAnswer(userInput: string, targetWord: string, context: string = '') {
    // Use both simple checking and grammar validation
    const simpleCheck = FillInBlankService.checkBlankAnswer(userInput, targetWord);
    const grammarValidation = GrammarValidationAPI.validateGrammar(userInput, targetWord, context);
    
    return {
      isCorrect: simpleCheck || grammarValidation.isCorrect,
      feedback: grammarValidation,
      simpleMatch: simpleCheck
    };
  }

  static generateScrambledWords(words: string[]): string[] {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static calculateProgress(wordsFixed: string[], totalWords: number): number {
    return Math.round((wordsFixed.length / totalWords) * 100);
  }
}
