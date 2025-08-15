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

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
}

export interface AppSettings {
  studyTime: number;
  preferredVersion: string;
  useAI: boolean;
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