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

  /**
   * NEW: Progressive fill-in-blank - only blanks the leftmost remaining wrong word
   * This ensures left-to-right progression as requested in refresh.md
   * TRANSLATION-AWARE: Supports mapping English wrong words to translated text positions
   */
  static calculateProgressiveFillInBlanks(
    originalText: string, 
    wrongWords: string[], 
    completedWords: string[] = [],
    translationMapping?: {englishText: string, englishWrongWords: string[]}
  ): FillInBlankResult {
    const words = originalText.split(' ');
    const blanks: BlankWord[] = [];
    
    // Find positions of all wrong words in the sentence
    const wrongWordPositions: Array<{word: string, position: number, completed: boolean}> = [];
    
    // TRANSLATION-AWARE LOGIC: Handle English wrong words in translated text
    if (translationMapping) {
      // Map English wrong word positions to translated text positions
      const englishWords = translationMapping.englishText.split(' ');
      const englishWrongWords = translationMapping.englishWrongWords;
      
      englishWrongWords.forEach(englishWrongWord => {
        // Find position in English text
        const englishPosition = englishWords.findIndex(word => 
          word.toLowerCase().replace(/[.,!?;:"']/g, '') === 
          englishWrongWord.toLowerCase().replace(/[.,!?;:"']/g, '')
        );
        
        if (englishPosition !== -1 && englishPosition < words.length) {
          // Map to corresponding position in translated text
          const translatedWord = words[englishPosition];
          const cleanTranslatedWord = translatedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
          
          // Check if this translated word is completed
          const isCompleted = completedWords.some(cw => 
            cw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanTranslatedWord
          );
          
          wrongWordPositions.push({
            word: translatedWord, // Use translated word
            position: englishPosition,
            completed: isCompleted
          });
        }
      });
    } else {
      // ORIGINAL LOGIC: Direct word matching (for non-translated text)
      words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
        const wrongWord = wrongWords.find(ww => 
          ww.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
        );
        
        if (wrongWord) {
          const isCompleted = completedWords.some(cw => 
            cw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
          );
          wrongWordPositions.push({
            word: wrongWord,
            position: index,
            completed: isCompleted
          });
        }
      });
    }
    
    // Sort by position to ensure left-to-right order
    wrongWordPositions.sort((a, b) => a.position - b.position);
    
    // Find the leftmost uncompleted wrong word
    const nextTargetWord = wrongWordPositions.find(wp => !wp.completed);
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      
      // Only blank the next target word (leftmost uncompleted)
      const shouldBlank = nextTargetWord && 
        nextTargetWord.position === index &&
        nextTargetWord.word.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord;
      
      blanks.push({
        word,
        isBlank: shouldBlank || false,
        underscores: shouldBlank ? this.generateUnderscores(word) : '',
        position: index
      });
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

  /**
   * NEW: Adaptive word selection for auto-generation based on range setting
   * Selects words to blank based on user's fillInBlankRange preference
   */
  static selectWordsForBlankRange(originalText: string, range: 'short' | 'long'): string[] {
    const words = originalText.split(' ');
    const meaningfulWords = words
      .map((word, index) => ({
        word: word.toLowerCase().replace(/[.,!?;:"']/g, ''),
        originalWord: word,
        index,
        length: word.replace(/[.,!?;:"']/g, '').length,
        importance: this.calculateWordImportance(word)
      }))
      .filter(item => item.length > 2) // Skip very short words
      .sort((a, b) => b.importance - a.importance); // Sort by importance (most important first)

    // Calculate target word count based on range
    let targetCount: number;
    if (range === 'short') {
      // SHORT: For proper cycling, ensure minimum 6 words (2 per round × 3 rounds)
      const percentage = 0.6 + Math.random() * 0.2; // Random between 60-80%
      targetCount = Math.max(6, Math.min(words.length, Math.round(words.length * percentage)));
    } else {
      // LONG: For more challenge, use most available words
      const percentage = 0.8 + Math.random() * 0.1; // Random between 80-90%
      targetCount = Math.max(Math.min(12, words.length), Math.round(words.length * percentage));
    }

    // Select a mix of important and random words
    const importantWords = meaningfulWords.slice(0, Math.ceil(targetCount * 0.6)); // 60% important
    const remainingWords = meaningfulWords.slice(Math.ceil(targetCount * 0.6));
    const randomWords = remainingWords
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, targetCount - importantWords.length); // Fill remaining slots

    const selectedWords = [...importantWords, ...randomWords]
      .map(item => item.originalWord)
      .slice(0, targetCount);

    return selectedWords;
  }

  /**
   * Calculate word importance for better blank selection
   * Higher scores mean more important words to practice
   */
  private static calculateWordImportance(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
    let score = 0;

    // Length bonus (longer words are more challenging)
    score += cleanWord.length * 2;

    // Theological/biblical terms get higher priority
    const biblicalTerms = ['god', 'lord', 'jesus', 'christ', 'spirit', 'holy', 'blessed', 'salvation', 'righteousness', 'faith', 'love', 'grace', 'mercy', 'truth', 'light', 'kingdom', 'heaven', 'eternal', 'glory', 'worship'];
    if (biblicalTerms.some(term => cleanWord.includes(term) || term.includes(cleanWord))) {
      score += 15;
    }

    // Action verbs get medium priority
    const actionVerbs = ['shall', 'will', 'give', 'gave', 'take', 'come', 'go', 'know', 'believe', 'trust', 'follow', 'obey', 'serve', 'praise', 'pray', 'forgive', 'heal', 'save', 'deliver'];
    if (actionVerbs.some(verb => cleanWord.includes(verb) || verb.includes(cleanWord))) {
      score += 10;
    }

    // Avoid very common words unless they're meaningful
    const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'his', 'her', 'him', 'she', 'you', 'your', 'they', 'them', 'this', 'that', 'with', 'from', 'into', 'unto'];
    if (commonWords.includes(cleanWord)) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Generate fill-in-blanks using adaptive range selection
   * Combines range-based word selection with existing blank generation
   */
  static calculateAdaptiveFillInBlanks(originalText: string, range: 'short' | 'long'): FillInBlankResult {
    const selectedWords = this.selectWordsForBlankRange(originalText, range);
    return this.calculateFillInBlanks(originalText, selectedWords);
  }
}
