import { ComparisonResult } from '../types';
import { GrammarValidationAPI } from './grammarValidationAPI';
import { OriginalVerseService } from './originalVerseService';

export interface SyntaxLabSessionData {
  id: string;
  verseText: string;
  verseReference: string;
  wrongWords: string[];
  originalVerseText: string;
  createdAt: Date;
}

export class SyntaxLabAPI {
  static createSession(comparisonResult: ComparisonResult): SyntaxLabSessionData {
    const { originalText, wrongWords } = OriginalVerseService.extractOriginalVerse(comparisonResult);
    const cleanOriginalText = OriginalVerseService.getCleanOriginalVerse(comparisonResult);
    const wordsToFix = OriginalVerseService.getWordsToFix(comparisonResult);
    
    return {
      id: `syntax-lab-${Date.now()}`,
      verseText: cleanOriginalText,
      verseReference: `${comparisonResult.originalComparison[0]?.verse || 'Unknown'}`,
      wrongWords: wordsToFix,
      originalVerseText: cleanOriginalText,
      createdAt: new Date()
    };
  }

  /**
   * Update session with completed words
   */
  static updateSessionProgress(sessionData: SyntaxLabSessionData, completedWords: string[]): SyntaxLabSessionData {
    return {
      ...sessionData
    };
  }

  static async validateAnswer(userInput: string, targetWord: string, context: string = '') {
    // Use both simple checking and grammar validation
    const cleanUser = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const cleanTarget = targetWord.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const simpleCheck = cleanUser === cleanTarget;
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
