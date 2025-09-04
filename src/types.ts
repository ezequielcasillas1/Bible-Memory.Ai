export interface Verse {
  id: string;
  text: string;
  reference: string;
  testament: 'OT' | 'NT';
  reason?: string;
  version?: string;
  context?: string;
  application?: string;
  memoryTips?: string;
}

export interface UserStats {
  totalPoints: number;
  versesMemorized: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalPracticeTime: number;
  achievements: Achievement[];
  weeklyGoal: number;
  dailyGoal: number;
  preferredVersion: string;
  userId?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface MemorizationSession {
  verse: Verse;
  startTime: Date;
  attempts: number;
  completed: boolean;
  accuracy: number;
}

export type Tab = 'generator' | 'memorize' | 'search' | 'favorites' | 'history' | 'profile' | 'syntax-lab';
export type VerseType = 'commission' | 'help';

export interface AppSettings {
  studyTime: number;
  preferredVersion: string;
  uiLanguage: string;
  preferredTranslationLanguage: string; // Keep this for Bible verse translation
  maxRounds: number; // Number of rounds for fill-in-blank and type-along practice
  fillInBlankRange: 'short' | 'long'; // Controls how many words to blank in auto-generation
}

export interface WordComparison {
  userWord: string;
  originalWord: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  position: number;
  suggestion?: string;
  verse?: string;
}

export interface ComparisonResult {
  accuracy: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  missingWords: number;
  extraWords: number;
  userComparison: WordComparison[];
  originalComparison: WordComparison[];
  detailedFeedback: string;
}

export interface SearchResult {
  id: string;
  text: string;
  reference: string;
  testament: 'OT' | 'NT';
  book: string;
  chapter: number;
  verse: number;
  version: string;
}

export interface VerseNote {
  id: string;
  verseId: string;
  verse: SearchResult;
  note: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteVerse {
  id: string;
  verse: SearchResult;
  addedAt: Date;
  category?: string;
}

export interface MemorizationHistory {
  id: string;
  verse: Verse;
  attempts: number;
  bestAccuracy: number;
  averageAccuracy: number;
  totalTime: number;
  lastPracticed: Date;
  status: 'learning' | 'reviewing' | 'mastered';
  userInput?: string; // The actual text the user typed
  comparisonResult?: ComparisonResult; // Detailed word-by-word comparison
}

export interface ImprovementPlan {
  id: string;
  title: string;
  description: string;
  targetVerses: string[];
  goals: {
    accuracy: number;
    timeframe: number; // days
    dailyPractice: number; // minutes
  };
  progress: {
    versesCompleted: number;
    averageAccuracy: number;
    daysActive: number;
  };
  createdAt: Date;
  status: 'active' | 'completed' | 'paused';
}

export interface SyntaxLabSession {
  id: string;
  verseId: string;
  verse: Verse;
  originalComparison: ComparisonResult;
  wrongWords: WordComparison[];
  practiceMode: 'blank' | 'type-along';
  currentRound: number;
  maxRounds: number;
  wordsFixed: string[];
  startTime: Date;
  endTime?: Date;
  finalAccuracy: number;
  improvementScore: number;
  fillInBlankResult?: import('./services/fillInBlankService').FillInBlankResult;
}

export interface WeakWord {
  id: string;
  word: string;
  originalWord: string;
  verse: string;
  reference: string;
  timesWrong: number;
  timesCorrect: number;
  lastMissed: Date;
  definition?: string;
  mastered: boolean;
}

export interface SyntaxLabStats {
  totalSessions: number;
  wordsFixed: number;
  averageImprovement: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  weakWords: WeakWord[];
  accuracyTrend: number[];
  mostMissedTypes: string[];
  streakDays: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}