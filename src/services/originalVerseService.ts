import { ComparisonResult, WordComparison } from '../types';

export class OriginalVerseService {
  static extractOriginalVerse(comparisonResult: ComparisonResult): { originalText: string; wrongWords: WordComparison[] } {
    const originalWords = comparisonResult.originalComparison.map(w => w.originalWord);
    const originalText = originalWords.join(' ');
    
    const wrongWords = [
      ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
      ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
    ];
    
    return { originalText, wrongWords };
  }

  static getCleanOriginalVerse(comparisonResult: ComparisonResult): string {
    return comparisonResult.originalComparison.map(w => w.originalWord).join(' ');
  }

  static validateOriginalText(originalText: string, wrongWords: WordComparison[]): boolean {
    const cleanedOriginalText = originalText.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    return wrongWords.every(wrongWord => {
      const cleanWrongWord = wrongWord.originalWord.toLowerCase().replace(/[.,!?;:"']/g, '');
      return cleanedOriginalText.includes(cleanWrongWord);
    });
  }

  static getWordsToFix(comparisonResult: ComparisonResult): string[] {
    const wrongWords = [
      ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
      ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
    ];
    
    return wrongWords.map(w => w.originalWord).filter(word => word && word.trim().length > 0);
  }
}
