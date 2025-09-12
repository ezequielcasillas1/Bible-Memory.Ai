/**
 * UNIFIED FILL-IN-BLANK SESSION FACTORY
 * 
 * Purpose: Consolidate all 3 session types (memorization, history, auto) 
 * into one consistent, type-safe API
 */

import { ComparisonResult, WordComparison } from './verseComparisonService';
import { FillInBlankAPI, FillInBlankState } from './fillInBlankService';
import { NumericalDifficultyAPI } from './numericalDifficultyAPI';
import { Verse, SyntaxLabSession, MemorizationHistory, AppSettings } from '../types';

// Enhanced session creation options
export interface SessionCreationOptions {
  verse: Verse;
  sessionType: 'memorization' | 'history' | 'auto';
  settings: AppSettings;
  
  // Optional data based on session type
  comparisonResult?: ComparisonResult;
  historyEntry?: MemorizationHistory;
  difficulty?: number;
}

// Unified session result
export interface SessionCreationResult {
  session: SyntaxLabSession;
  failedWords: string[];
  sessionMetadata: {
    source: 'memorization' | 'history' | 'auto';
    wordCount: number;
    difficulty: number;
    estimatedTime: number;
  };
}

export class FillInBlankSessionFactory {
  
  /**
   * MAIN API: Create any type of fill-in-blank session
   */
  static createSession(options: SessionCreationOptions): SessionCreationResult {
    switch (options.sessionType) {
      case 'memorization':
        return this.createMemorizationSession(options);
      case 'history':
        return this.createHistorySession(options);
      case 'auto':
        return this.createAutoSession(options);
      default:
        throw new Error(`Unknown session type: ${options.sessionType}`);
    }
  }

  /**
   * SESSION TYPE 1: From memorization results
   */
  private static createMemorizationSession(options: SessionCreationOptions): SessionCreationResult {
    if (!options.comparisonResult) {
      throw new Error('Memorization session requires comparisonResult');
    }

    const { verse, comparisonResult, settings } = options;
    
    // Extract unique failed words from comparison
    const wrongWords = [
      ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
      ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
    ];

    // Get unique failed words
    const uniqueFailedWords = Array.from(new Set(
      wrongWords.map(w => (w.originalWord || w.userWord).toLowerCase().replace(/[.,!?;:"']/g, ''))
    ));

    // Create fill-in-blank state
    const fillInBlankState: FillInBlankState = {
      verse: verse.text,
      failedWords: uniqueFailedWords,
      completedWords: [],
      currentBlankIndex: 0
    };

    const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);

    const session: SyntaxLabSession = {
      id: `memorization-${Date.now()}`,
      verseId: verse.id,
      verse,
      originalComparison: comparisonResult,
      wrongWords,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: settings.maxRounds || 3,
      wordsFixed: [],
      startTime: new Date(),
      endTime: undefined,
      fillInBlankResult,
      finalAccuracy: 0,
      improvementScore: 0
    };

    return {
      session,
      failedWords: uniqueFailedWords,
      sessionMetadata: {
        source: 'memorization',
        wordCount: uniqueFailedWords.length,
        difficulty: this.calculateDifficulty(uniqueFailedWords.length),
        estimatedTime: uniqueFailedWords.length * 30 // 30 seconds per word
      }
    };
  }

  /**
   * SESSION TYPE 2: From practice history
   */
  private static createHistorySession(options: SessionCreationOptions): SessionCreationResult {
    if (!options.historyEntry) {
      throw new Error('History session requires historyEntry');
    }

    const { verse, historyEntry, settings } = options;
    
    // Select words based on historical accuracy
    const accuracyBasedWordCount = Math.max(
      3, 
      Math.min(8, Math.round(((100 - historyEntry.bestAccuracy) / 100) * 8))
    );

    // Use numerical difficulty to select challenging words
    const selectedWords = NumericalDifficultyAPI.selectWordsForDifficulty(
      verse.text,
      settings.fillInBlankDifficulty || 6
    ).slice(0, accuracyBasedWordCount);

    // Create mock comparison for session
    const mockComparison: WordComparison[] = selectedWords.map((word, index) => ({
      originalWord: word.replace(/[.,!?;:"']/g, ''),
      userWord: '',
      status: 'incorrect' as const,
      position: index
    }));

    const mockComparisonResult: ComparisonResult = {
      accuracy: historyEntry.bestAccuracy,
      totalWords: verse.text.split(' ').length,
      correctWords: Math.round((historyEntry.bestAccuracy / 100) * 20),
      incorrectWords: selectedWords.length,
      missingWords: 0,
      extraWords: 0,
      userComparison: mockComparison,
      originalComparison: [],
      detailedFeedback: `History practice for ${verse.reference}`
    };

    // Create fill-in-blank state
    const fillInBlankState: FillInBlankState = {
      verse: verse.text,
      failedWords: selectedWords.map(w => w.toLowerCase().replace(/[.,!?;:"']/g, '')),
      completedWords: [],
      currentBlankIndex: 0
    };

    const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);

    const session: SyntaxLabSession = {
      id: `history-${Date.now()}`,
      verseId: verse.id,
      verse,
      originalComparison: mockComparisonResult,
      wrongWords: mockComparison,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: settings.maxRounds || 3,
      wordsFixed: [],
      startTime: new Date(),
      endTime: undefined,
      fillInBlankResult,
      finalAccuracy: 0,
      improvementScore: 0
    };

    return {
      session,
      failedWords: selectedWords.map(w => w.toLowerCase().replace(/[.,!?;:"']/g, '')),
      sessionMetadata: {
        source: 'history',
        wordCount: selectedWords.length,
        difficulty: settings.fillInBlankDifficulty || 6,
        estimatedTime: selectedWords.length * 25 // Slightly faster for practice
      }
    };
  }

  /**
   * SESSION TYPE 3: Auto-generated practice
   */
  private static createAutoSession(options: SessionCreationOptions): SessionCreationResult {
    const { verse, settings } = options;
    const difficulty = options.difficulty || settings.fillInBlankDifficulty || 6;
    
    // Use numerical difficulty API for intelligent word selection
    const selectedWords = NumericalDifficultyAPI.selectWordsForDifficulty(verse.text, difficulty);

    // Create mock comparison for session
    const mockComparison: WordComparison[] = selectedWords.map((word, index) => ({
      originalWord: word.replace(/[.,!?;:"']/g, ''),
      userWord: '',
      status: 'incorrect' as const,
      position: index
    }));

    const mockComparisonResult: ComparisonResult = {
      accuracy: 70, // Default for auto practice
      totalWords: verse.text.split(' ').length,
      correctWords: verse.text.split(' ').length - selectedWords.length,
      incorrectWords: selectedWords.length,
      missingWords: 0,
      extraWords: 0,
      userComparison: mockComparison,
      originalComparison: [],
      detailedFeedback: `Auto-generated practice session`
    };

    // Create fill-in-blank state
    const fillInBlankState: FillInBlankState = {
      verse: verse.text,
      failedWords: selectedWords.map(w => w.toLowerCase().replace(/[.,!?;:"']/g, '')),
      completedWords: [],
      currentBlankIndex: 0
    };

    const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);

    const session: SyntaxLabSession = {
      id: `auto-${Date.now()}`,
      verseId: verse.id,
      verse,
      originalComparison: mockComparisonResult,
      wrongWords: mockComparison,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: settings.maxRounds || 3,
      wordsFixed: [],
      startTime: new Date(),
      endTime: undefined,
      fillInBlankResult,
      finalAccuracy: 0,
      improvementScore: 0
    };

    return {
      session,
      failedWords: selectedWords.map(w => w.toLowerCase().replace(/[.,!?;:"']/g, '')),
      sessionMetadata: {
        source: 'auto',
        wordCount: selectedWords.length,
        difficulty: difficulty,
        estimatedTime: selectedWords.length * 20 // Fastest for auto practice
      }
    };
  }

  /**
   * HELPER: Calculate difficulty based on word count
   */
  private static calculateDifficulty(wordCount: number): number {
    if (wordCount <= 2) return 3; // Easy
    if (wordCount <= 4) return 6; // Medium
    if (wordCount <= 6) return 8; // Hard
    return 10; // Expert
  }

  /**
   * HELPER: Get sample verses for auto practice
   */
  static getSampleVerses(): Verse[] {
    return [
      {
        id: 'john-3-16',
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        reference: 'John 3:16',
        testament: 'NT'
      },
      {
        id: 'psalm-23-1',
        text: 'The LORD is my shepherd, I lack nothing.',
        reference: 'Psalm 23:1',
        testament: 'OT'
      },
      {
        id: 'romans-8-28',
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        reference: 'Romans 8:28',
        testament: 'NT'
      },
      {
        id: 'philippians-4-13',
        text: 'I can do all this through him who gives me strength.',
        reference: 'Philippians 4:13',
        testament: 'NT'
      },
      {
        id: 'jeremiah-29-11',
        text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you hope and a future.',
        reference: 'Jeremiah 29:11',
        testament: 'OT'
      }
    ];
  }
}
