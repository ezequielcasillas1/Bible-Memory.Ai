import { ComparisonResult } from '../types';
import { FillInBlankService, type FillInBlankResult } from './fillInBlankService';
import { GrammarValidationAPI } from './grammarValidationAPI';
import { OriginalVerseService } from './originalVerseService';

export interface SyntaxLabSessionData {
  id: string;
  verseText: string;
  verseReference: string;
  wrongWords: string[];
  fillInBlankResult?: FillInBlankResult;
  originalVerseText: string;
  createdAt: Date;
}

export class SyntaxLabAPI {
  static createSession(comparisonResult: ComparisonResult): SyntaxLabSessionData {
    const { originalText, wrongWords } = OriginalVerseService.extractOriginalVerse(comparisonResult);
    const cleanOriginalText = OriginalVerseService.getCleanOriginalVerse(comparisonResult);
    const wordsToFix = OriginalVerseService.getWordsToFix(comparisonResult);
    
    // Generate fill-in-blank data
    const fillInBlankResult = FillInBlankService.calculateFillInBlanks(cleanOriginalText, wordsToFix);
    
    return {
      id: `syntax-lab-${Date.now()}`,
      verseText: cleanOriginalText,
      verseReference: `${comparisonResult.originalComparison[0]?.verse || 'Unknown'}`,
      wrongWords: wordsToFix,
      fillInBlankResult,
      originalVerseText: cleanOriginalText,
      createdAt: new Date()
    };
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
