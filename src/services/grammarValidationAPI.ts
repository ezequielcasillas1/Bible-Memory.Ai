export interface GrammarValidation {
  isCorrect: boolean;
  confidence: number;
  suggestions: string[];
  grammarRule: string;
  contextualHint: string;
  errorType?: 'spelling' | 'tense' | 'article' | 'preposition' | 'punctuation' | 'capitalization';
}

export interface ContextualHint {
  hint: string;
  example: string;
  category: 'grammar' | 'spelling' | 'context' | 'theological';
}

export class GrammarValidationAPI {
  private static grammarRules = {
    articles: ['a', 'an', 'the'],
    prepositions: ['in', 'on', 'at', 'by', 'for', 'with', 'from', 'to', 'of', 'about', 'through', 'into', 'unto', 'upon', 'against'],
    conjunctions: ['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'therefore', 'however', 'moreover', 'furthermore'],
    biblicalTerms: ['lord', 'god', 'jesus', 'christ', 'holy', 'spirit', 'father', 'salvation', 'righteousness', 'grace', 'mercy', 'love', 'faith', 'hope', 'peace'],
    commonMistakes: {
      'recieve': 'receive',
      'beleive': 'believe',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred'
    } as Record<string, string>
  };

  static validateGrammar(userWord: string, originalWord: string, context: string = ''): GrammarValidation {
    const userLower = userWord.toLowerCase().trim();
    const originalLower = originalWord.toLowerCase().trim();
    
    // Exact match
    if (userLower === originalLower) {
      return {
        isCorrect: true,
        confidence: 1.0,
        suggestions: [],
        grammarRule: 'exact_match',
        contextualHint: 'Perfect match!'
      };
    }

    // Check for common spelling mistakes
    if (this.grammarRules.commonMistakes[userLower]) {
      const suggestion = this.grammarRules.commonMistakes[userLower];
      return {
        isCorrect: suggestion === originalLower,
        confidence: 0.9,
        suggestions: [suggestion],
        grammarRule: 'spelling_correction',
        contextualHint: `Common spelling: "${userWord}" → "${suggestion}"`,
        errorType: 'spelling'
      };
    }

    // Check capitalization issues
    if (userWord.toLowerCase() === originalWord.toLowerCase()) {
      return {
        isCorrect: false,
        confidence: 0.8,
        suggestions: [originalWord],
        grammarRule: 'capitalization',
        contextualHint: 'Check capitalization - biblical names and "Lord" are often capitalized',
        errorType: 'capitalization'
      };
    }

    // Check for similar words (Levenshtein distance)
    const similarity = this.calculateSimilarity(userLower, originalLower);
    
    if (similarity > 0.7) {
      let errorType: GrammarValidation['errorType'] = 'spelling';
      let hint = 'Check spelling';
      
      // Determine error type based on context
      if (this.grammarRules.biblicalTerms.includes(originalLower)) {
        errorType = 'spelling';
        hint = `"${originalWord}" is a biblical term - check spelling carefully`;
      } else if (this.grammarRules.prepositions.includes(originalLower)) {
        errorType = 'preposition';
        hint = `"${originalWord}" is a preposition - these connect words and phrases`;
      } else if (this.grammarRules.conjunctions.includes(originalLower)) {
        errorType = 'preposition';
        hint = `"${originalWord}" is a connecting word - it joins clauses or sentences`;
      }

      return {
        isCorrect: false,
        confidence: similarity,
        suggestions: [originalWord],
        grammarRule: 'similarity_match',
        contextualHint: hint,
        errorType
      };
    }

    // Check for tense variations
    if (this.checkTenseVariation(userLower, originalLower)) {
      return {
        isCorrect: false,
        confidence: 0.6,
        suggestions: [originalWord],
        grammarRule: 'tense_variation',
        contextualHint: `Check verb tense: "${userWord}" vs "${originalWord}"`,
        errorType: 'tense'
      };
    }

    // Default case - completely different word
    return {
      isCorrect: false,
      confidence: 0.2,
      suggestions: [originalWord],
      grammarRule: 'different_word',
      contextualHint: `Expected "${originalWord}" - this is a key word in the verse`,
      errorType: 'spelling'
    };
  }

  static getContextualHints(wrongWords: string[], verseContext: string = ''): ContextualHint[] {
    return wrongWords.map(word => {
      const lowerWord = word.toLowerCase();
      
      if (this.grammarRules.biblicalTerms.includes(lowerWord)) {
        return {
          hint: `"${word}" is a theological term`,
          example: `In biblical context, "${word}" often refers to divine attributes or concepts`,
          category: 'theological'
        };
      } else if (this.grammarRules.prepositions.includes(lowerWord)) {
        return {
          hint: `"${word}" shows relationship between words`,
          example: `Prepositions like "${word}" connect nouns to other parts of the sentence`,
          category: 'grammar'
        };
      } else if (this.grammarRules.conjunctions.includes(lowerWord)) {
        return {
          hint: `"${word}" connects ideas or clauses`,
          example: `"${word}" joins different parts of the sentence together`,
          category: 'grammar'
        };
      } else {
        return {
          hint: `"${word}" is important for meaning`,
          example: `Pay attention to spelling and context of "${word}"`,
          category: 'context'
        };
      }
    });
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - matrix[len2][len1] / maxLen;
  }

  private static checkTenseVariation(word1: string, word2: string): boolean {
    // Simple tense checking - extend as needed
    const tensePatterns = [
      { base: 'run', variations: ['runs', 'running', 'ran'] },
      { base: 'come', variations: ['comes', 'coming', 'came'] },
      { base: 'go', variations: ['goes', 'going', 'went'] },
      { base: 'have', variations: ['has', 'having', 'had'] },
      { base: 'be', variations: ['is', 'are', 'was', 'were', 'being', 'been'] },
      { base: 'love', variations: ['loves', 'loving', 'loved'] },
      { base: 'believe', variations: ['believes', 'believing', 'believed'] }
    ];

    for (const pattern of tensePatterns) {
      const allForms = [pattern.base, ...pattern.variations];
      if (allForms.includes(word1) && allForms.includes(word2)) {
        return true;
      }
    }

    // Check for common suffix patterns
    const suffixPatterns = [
      { suffix1: 'ed', suffix2: 'ing' },
      { suffix1: 's', suffix2: '' },
      { suffix1: 'es', suffix2: '' }
    ];

    for (const { suffix1, suffix2 } of suffixPatterns) {
      if (word1.endsWith(suffix1) && word2.endsWith(suffix2)) {
        const base1 = word1.slice(0, -suffix1.length);
        const base2 = word2.slice(0, -suffix2.length);
        if (base1 === base2) return true;
      }
    }

    return false;
  }
}
