/**
 * ROUND PROGRESSION API
 * Handles dynamic round/word/state flow control for any round configuration
 * Supports: 1/3, 1/4, 1/5, etc. based on user settings
 */

export interface RoundProgressionState {
  currentRound: number;
  maxRounds: number;
  wordsFixed: string[];
  currentRoundWords: string[];
  totalWords: string[];
}

export interface RoundProgressionResult {
  shouldAdvanceRound: boolean;
  shouldCompleteSession: boolean;
  nextRoundState?: RoundProgressionState;
  progressData: {
    currentRound: number;
    maxRounds: number;
    roundProgress: {
      completed: number;
      total: number;
      percentage: number;
    };
    globalProgress: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
}

export class RoundProgressionAPI {
  
  /**
   * Calculate words distribution across rounds
   * Ensures even distribution with remainder handling
   */
  static calculateWordsPerRound(totalWords: number, maxRounds: number): number[] {
    const baseWordsPerRound = Math.floor(totalWords / maxRounds);
    const extraWords = totalWords % maxRounds;
    
    const distribution: number[] = [];
    for (let round = 1; round <= maxRounds; round++) {
      // First 'extraWords' rounds get one extra word
      const wordsInRound = baseWordsPerRound + (round <= extraWords ? 1 : 0);
      distribution.push(wordsInRound);
    }
    
    return distribution;
  }

  /**
   * Get words assigned to a specific round
   */
  static getWordsForRound(
    allWords: string[], 
    targetRound: number, 
    maxRounds: number
  ): string[] {
    const distribution = this.calculateWordsPerRound(allWords.length, maxRounds);
    
    // Calculate start index for target round
    let startIndex = 0;
    for (let round = 1; round < targetRound; round++) {
      startIndex += distribution[round - 1];
    }
    
    // Get words for target round
    const wordsInTargetRound = distribution[targetRound - 1];
    const endIndex = startIndex + wordsInTargetRound;
    
    return allWords.slice(startIndex, endIndex);
  }

  /**
   * CORE API: Process word submission and determine round progression
   */
  static processWordSubmission(
    state: RoundProgressionState,
    submittedWord: string,
    isCorrect: boolean
  ): RoundProgressionResult {
    
    // Create updated words fixed array if correct
    const updatedWordsFixed = isCorrect 
      ? [...state.wordsFixed, submittedWord]
      : state.wordsFixed;

    // Calculate current round progress
    const currentRoundWords = this.getWordsForRound(
      state.totalWords, 
      state.currentRound, 
      state.maxRounds
    );
    
    const roundCompleted = updatedWordsFixed.length;
    const roundTotal = currentRoundWords.length;
    const roundPercentage = roundTotal > 0 ? Math.round((roundCompleted / roundTotal) * 100) : 0;

    // Calculate global progress
    const distribution = this.calculateWordsPerRound(state.totalWords.length, state.maxRounds);
    let wordsInPreviousRounds = 0;
    for (let round = 1; round < state.currentRound; round++) {
      wordsInPreviousRounds += distribution[round - 1];
    }
    
    const globalCompleted = wordsInPreviousRounds + roundCompleted;
    const globalTotal = state.totalWords.length;
    const globalPercentage = Math.round((globalCompleted / globalTotal) * 100);

    // Determine if round should advance
    const shouldAdvanceRound = roundPercentage >= 100 && state.currentRound < state.maxRounds;
    const shouldCompleteSession = roundPercentage >= 100 && state.currentRound >= state.maxRounds;

    // Create next round state if advancing
    let nextRoundState: RoundProgressionState | undefined;
    if (shouldAdvanceRound) {
      const nextRound = state.currentRound + 1;
      const nextRoundWords = this.getWordsForRound(
        state.totalWords, 
        nextRound, 
        state.maxRounds
      );
      
      nextRoundState = {
        currentRound: nextRound,
        maxRounds: state.maxRounds,
        wordsFixed: [], // Reset for new round
        currentRoundWords: nextRoundWords,
        totalWords: state.totalWords
      };
    }

    return {
      shouldAdvanceRound,
      shouldCompleteSession,
      nextRoundState,
      progressData: {
        currentRound: state.currentRound,
        maxRounds: state.maxRounds,
        roundProgress: {
          completed: roundCompleted,
          total: roundTotal,
          percentage: roundPercentage
        },
        globalProgress: {
          completed: globalCompleted,
          total: globalTotal,
          percentage: globalPercentage
        }
      }
    };
  }

  /**
   * Initialize round progression state
   */
  static initializeState(
    totalWords: string[], 
    maxRounds: number
  ): RoundProgressionState {
    const currentRoundWords = this.getWordsForRound(totalWords, 1, maxRounds);
    
    return {
      currentRound: 1,
      maxRounds,
      wordsFixed: [],
      currentRoundWords,
      totalWords
    };
  }

  /**
   * Debug helper: Get round distribution info
   */
  static getDebugInfo(totalWords: string[], maxRounds: number) {
    const distribution = this.calculateWordsPerRound(totalWords.length, maxRounds);
    const roundDetails = [];
    
    for (let round = 1; round <= maxRounds; round++) {
      const words = this.getWordsForRound(totalWords, round, maxRounds);
      roundDetails.push({
        round,
        wordCount: distribution[round - 1],
        words: words
      });
    }
    
    return {
      totalWords: totalWords.length,
      maxRounds,
      distribution,
      roundDetails
    };
  }
}

