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

export type Tab = 'generator' | 'memorize' | 'profile';
export type VerseType = 'commission' | 'help';

export interface AppSettings {
  studyTime: number;
  preferredVersion: string;
}

export interface WordComparison {
  userWord: string;
  originalWord: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  position: number;
  suggestion?: string;
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