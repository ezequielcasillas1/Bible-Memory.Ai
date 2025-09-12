export type PracticeMode = 'blank' | 'type-along';
export type SessionPhase = 'summary' | 'practice' | 'flashcards' | 'challenge' | 'scorecard' | 'completion';

export interface SyntaxLabPhaseProps {
  currentSession: any;
  comparisonResult: any;
  selectedVerse: any;
  displayVerse: any;
  translatedSessionVerse: any;
  translatedTypeAlongVerse: any;
  practiceMode: PracticeMode;
  setPracticeMode: (mode: PracticeMode) => void;
  setPhase: (phase: SessionPhase) => void;
  onStartNewSession: () => void;
  onBack: () => void;
  settings: any;
  t: (key: any) => string;
}

export interface PracticePhaseProps extends SyntaxLabPhaseProps {
  currentRound: number;
  setCurrentRound: (round: number) => void;
  wordsFixed: string[];
  setWordsFixed: (words: string[]) => void;
  currentWordIndex: number;
  setCurrentWordIndex: (index: number) => void;
  userInput: string;
  setUserInput: (input: string) => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  currentHint: string;
  setCurrentHint: (hint: string) => void;
  isLoadingHint: boolean;
  setIsLoadingHint: (loading: boolean) => void;
  showAnswer: boolean;
  setShowAnswer: (show: boolean) => void;
  floatingEmoji: { id: string; emoji: string; x: number; y: number } | null;
  setFloatingEmoji: (emoji: { id: string; emoji: string; x: number; y: number } | null) => void;
  typeAlongVerses: any[];
  setTypeAlongVerses: (verses: any[]) => void;
  currentVerseIndex: number;
  setCurrentVerseIndex: (index: number) => void;
  verseCompletionData: Array<{verse: any, accuracy: number, timeSpent: number, completedAt: Date}>;
  setVerseCompletionData: (data: Array<{verse: any, accuracy: number, timeSpent: number, completedAt: Date}>) => void;
  hasCompletedFirstVerse: boolean;
  setHasCompletedFirstVerse: (completed: boolean) => void;
  showTypeAlongResults: boolean;
  setShowTypeAlongResults: (show: boolean) => void;
  verseStartTime: Date | null;
  setVerseStartTime: (time: Date | null) => void;
  submittingRef: React.MutableRefObject<boolean>;
  handleWordSubmit: () => void;
  handleVerseCompletion: (accuracy: number) => void;
  renderWordWithMask: (word: string, round: number) => string;
  renderBlankWord: (word: string) => string;
  renderEnhancedTypingWord: (originalWord: string, userInput: string, round: number) => any;
  getProgressData: () => { global: { completed: number; total: number; currentWord: number; percentage: number }; round: { completed: number; total: number; currentWord: number; percentage: number } };
}

export interface FlashcardsPhaseProps extends SyntaxLabPhaseProps {
  showFlashcard: boolean;
  setShowFlashcard: (show: boolean) => void;
  flashcardSide: 'front' | 'back';
  setFlashcardSide: (side: 'front' | 'back') => void;
  currentWordIndex: number;
  setCurrentWordIndex: (index: number) => void;
}

export interface ChallengePhaseProps extends SyntaxLabPhaseProps {
  challengeTimeLeft: number;
  setChallengeTimeLeft: (time: number) => void;
  challengeActive: boolean;
  setChallengeActive: (active: boolean) => void;
  currentWordIndex: number;
  setCurrentWordIndex: (index: number) => void;
  userInput: string;
  setUserInput: (input: string) => void;
  wordsFixed: string[];
  setWordsFixed: (words: string[]) => void;
}

export interface ScorecardPhaseProps extends SyntaxLabPhaseProps {
  stats: any;
  weakWords: any[];
  memorizationHistory: any[];
  isLoadingHistory: boolean;
  setIsLoadingHistory: (loading: boolean) => void;
  showHistoryLog: boolean;
  setShowHistoryLog: (show: boolean) => void;
}

export interface CompletionPhaseProps extends SyntaxLabPhaseProps {
  // Completion phase doesn't need additional props beyond the base
}
