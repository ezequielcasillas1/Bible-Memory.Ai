export interface BlankWord {
  word: string;
  isBlank: boolean;
  underscores: string;
  position: number;
}

export interface FillInBlankResult {
  blanks: BlankWord[];
  formattedText: string;
  totalBlanks: number;
}

export class FillInBlankService {
  static calculateFillInBlanks(originalText: string, wrongWords: string[]): FillInBlankResult {
    const words = originalText.split(' ');
    const blanks: BlankWord[] = [];
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const isTargetWord = wrongWords.some(wrongWord => 
        wrongWord.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      
      if (isTargetWord) {
        blanks.push({
          word,
          isBlank: true,
          underscores: this.generateUnderscores(word),
          position: index
        });
      } else {
        blanks.push({
          word,
          isBlank: false,
          underscores: '',
          position: index
        });
      }
    });

    const formattedText = this.generateFormattedText(blanks);
    const totalBlanks = blanks.filter(b => b.isBlank).length;

    return {
      blanks,
      formattedText,
      totalBlanks
    };
  }

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

  static generateFormattedText(blankWords: BlankWord[]): string {
    const CHARS_PER_LINE_MOBILE = 35;
    const CHARS_PER_LINE = CHARS_PER_LINE_MOBILE; // Mobile-first approach
    
    let currentLine = '';
    let result: string[] = [];
    
    blankWords.forEach((blankWord, index) => {
      const wordToAdd = blankWord.isBlank ? blankWord.underscores : blankWord.word;
      const wordWithSpace = index === 0 ? wordToAdd : ` ${wordToAdd}`;
      
      if (currentLine.length + wordWithSpace.length > CHARS_PER_LINE && currentLine.length > 0) {
        // Handle long words with hyphenation
        if (wordToAdd.length > 12 && !blankWord.isBlank) {
          const splitPoint = Math.floor(wordToAdd.length * 0.6);
          const firstPart = wordToAdd.substring(0, splitPoint) + '-';
          const secondPart = wordToAdd.substring(splitPoint);
          
          result.push(currentLine + (currentLine.length > 0 ? ' ' : '') + firstPart);
          currentLine = secondPart;
        } else {
          result.push(currentLine);
          currentLine = wordToAdd;
        }
      } else {
        currentLine += wordWithSpace;
      }
    });
    
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    
    return result.join('\n');
  }

  static checkBlankAnswer(userInput: string, targetWord: string): boolean {
    const cleanUser = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const cleanTarget = targetWord.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    return cleanUser === cleanTarget;
  }

  static getRemainingBlanks(fillInBlankResult: FillInBlankResult, filledWords: { [key: number]: string }): number {
    const totalBlanks = fillInBlankResult.blanks.filter(b => b.isBlank).length;
    const filledBlanks = Object.keys(filledWords).length;
    return totalBlanks - filledBlanks;
  }
}
