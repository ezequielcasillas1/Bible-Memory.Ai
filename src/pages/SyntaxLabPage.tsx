import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison, MemorizationHistory, Verse, AppSettings } from '../types';
import { useAutoTranslatedVerse } from '../hooks/useAutoTranslatedVerse';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryService } from '../services/historyService';
import { OriginalVerseService } from '../services/originalVerseService';
import { SyntaxLabAPI, type SyntaxLabSessionData } from '../services/syntaxLabAPI';
import { FillInBlankService, FillInBlankAPI } from '../services/fillInBlankService';
import { RoundProgressionAPI, RoundProgressionState } from '../services/roundProgressionAPI';

// Import new components
import SummaryPhase from '../components/syntaxlab/SummaryPhase';
import PracticePhase from '../components/syntaxlab/PracticePhase';
import FlashcardsPhase from '../components/syntaxlab/FlashcardsPhase';
import ChallengePhase from '../components/syntaxlab/ChallengePhase';
import ScorecardPhase from '../components/syntaxlab/ScorecardPhase';
import CompletionPhase from '../components/syntaxlab/CompletionPhase';
import { PracticeMode, SessionPhase } from '../components/syntaxlab/types';

interface SyntaxLabPageProps {
  comparisonResult: ComparisonResult | null;
  selectedVerse: Verse | null;
  onBack: () => void;
  onStartNewSession: () => void;
  settings: AppSettings;
}

const SyntaxLabPageRefactored: React.FC<SyntaxLabPageProps> = ({ 
  comparisonResult, 
  selectedVerse, 
  onBack, 
  onStartNewSession, 
  settings 
}) => {
  const { t } = useLanguage();
  
  const [phase, setPhase] = useState<SessionPhase>('summary');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('blank');
  const [currentSession, setCurrentSession] = useState<SyntaxLabSession | null>(null);
  
  // Use auto-translated verse for display - use session verse if available
  const verseToTranslate = currentSession?.verse || selectedVerse;
  const displayVerse = useAutoTranslatedVerse(verseToTranslate);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordsFixed, setWordsFixed] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [flashcardSide, setFlashcardSide] = useState<'front' | 'back'>('front');
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(30);
  const [challengeActive, setChallengeActive] = useState(false);
  const [stats, setStats] = useState<SyntaxLabStats | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [memorizationHistory, setMemorizationHistory] = useState<MemorizationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryLog, setShowHistoryLog] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<{ id: string; emoji: string; x: number; y: number } | null>(null);
  
  // Type-Along mode state
  const [typeAlongVerses, setTypeAlongVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [verseCompletionData, setVerseCompletionData] = useState<Array<{verse: Verse, accuracy: number, timeSpent: number, completedAt: Date}>>([]);
  const [hasCompletedFirstVerse, setHasCompletedFirstVerse] = useState(false);
  const [showTypeAlongResults, setShowTypeAlongResults] = useState(false);
  const [verseStartTime, setVerseStartTime] = useState<Date | null>(null);
  const submittingRef = useRef(false);

  // Auto-translate session verse
  const sessionVerse = currentSession?.verse || null;
  const translatedSessionVerse = useAutoTranslatedVerse(sessionVerse);

  // Auto-translate current type-along verse
  const currentTypeAlongVerse = typeAlongVerses.length > 0 && currentVerseIndex < typeAlongVerses.length 
    ? typeAlongVerses[currentVerseIndex] 
    : null;
  const translatedTypeAlongVerse = useAutoTranslatedVerse(currentTypeAlongVerse);

  // Load stats and weak words from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('syntaxLabStats');
    const savedWeakWords = localStorage.getItem('syntaxLabWeakWords');
    
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    
    if (savedWeakWords) {
      setWeakWords(JSON.parse(savedWeakWords));
    }
  }, []);

  // Initialize session when comparison result is available
  useEffect(() => {
    if (comparisonResult && !currentSession) {
      // CRITICAL FIX: Use translated verse text if available for fill-in-blank creation
      const translatedVerseText = displayVerse?.isTranslated ? displayVerse.text : null;
      
      // Create session using SyntaxLabAPI to ensure fillInBlankResult is properly initialized
      const sessionData = SyntaxLabAPI.createSession(comparisonResult);
      
      // Extract wrongWords as WordComparison[] (as expected by SyntaxLabSession type)
      const wrongWords = [
        ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
        ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
      ];
      
      // Use selectedVerse for reference and testament, fallback to extracted data
      const verse = selectedVerse || {
        id: `verse-${Date.now()}`,
        text: sessionData.originalText,
        reference: 'Custom Verse',
        testament: 'NT' as const
      };

      // TRANSLATION-AWARE FILL-IN-BLANK CREATION
      const fillInBlankResult = translatedVerseText
        ? FillInBlankAPI.createFillInBlankFromTranslatedText(translatedVerseText, wrongWords)
        : FillInBlankAPI.createFillInBlank(sessionData.originalText, wrongWords);

      const session: SyntaxLabSession = {
        id: sessionData.id,
        verse,
        wrongWords,
        maxRounds: sessionData.maxRounds,
        startTime: new Date(),
        endTime: null,
        fillInBlankResult,
        finalAccuracy: 0,
        improvementScore: 0
      };

      console.log('🎯 SYNTAX LAB SESSION INITIALIZED:', {
        sessionId: session.id,
        verseText: verse.text,
        translatedVerseText,
        wrongWordsCount: wrongWords.length,
        fillInBlankResult,
        isTranslated: displayVerse?.isTranslated,
        translationLanguage: displayVerse?.translationLanguage
      });

      setCurrentSession(session);
    }
  }, [comparisonResult, selectedVerse, displayVerse, currentSession]);

  // Placeholder functions - these would need to be extracted from the original file
  const startPractice = (mode: PracticeMode) => {
    setPracticeMode(mode);
    setPhase('practice');
    setCurrentWordIndex(0);
    setUserInput('');
    
    // Initialize Type-Along mode with multiple verses
    if (mode === 'type-along') {
      initializeTypeAlongSession();
    }
  };

  const initializeTypeAlongSession = () => {
    // This would contain the actual implementation from the original file
    console.log('Initialize Type-Along Session');
  };

  const startChallenge = () => {
    setPhase('challenge');
    setChallengeTimeLeft(30);
    setChallengeActive(true);
    setCurrentWordIndex(0);
    setUserInput('');
  };

  const completeSession = () => {
    if (!currentSession) return;
    // This would contain the actual implementation from the original file
    console.log('Complete Session');
    setPhase('scorecard');
  };

  const getProgressData = () => {
    if (!currentSession) {
      return {
        global: { completed: 0, total: 0, currentWord: 1, percentage: 0 },
        round: { completed: 0, total: 0, percentage: 0 }
      };
    }
    // This would contain the actual implementation from the original file
    return {
      global: { completed: wordsFixed.length, total: currentSession.wrongWords.length, currentWord: 1, percentage: 50 },
      round: { completed: 0, total: 0, percentage: 0 }
    };
  };

  const startAutoPractice = () => {
    console.log('Start Auto Practice');
  };

  const restartRegularPractice = () => {
    if (currentSession) {
      setCurrentRound(1);
      setWordsFixed([]);
      setCurrentWordIndex(0);
      setUserInput('');
      setShowHint(false);
      setPhase('practice');
    }
  };

  const handleWordSubmit = () => {
    console.log('Handle Word Submit');
  };

  const handleVerseCompletion = (accuracy: number) => {
    console.log('Handle Verse Completion', accuracy);
  };

  const renderWordWithMask = (word: string, round: number): string => {
    return word; // Placeholder
  };

  const renderBlankWord = (word: string): string => {
    return '____';
  };

  const renderEnhancedTypingWord = (originalWord: string, userInput: string, round: number) => {
    return <span>{originalWord}</span>; // Placeholder
  };

  // Common props for all phase components
  const commonProps = {
    currentSession,
    comparisonResult,
    selectedVerse,
    displayVerse,
    translatedSessionVerse,
    translatedTypeAlongVerse,
    practiceMode,
    setPracticeMode,
    setPhase,
    onStartNewSession,
    onBack,
    settings,
    t
  };

  const practiceProps = {
    ...commonProps,
    currentRound,
    setCurrentRound,
    wordsFixed,
    setWordsFixed,
    currentWordIndex,
    setCurrentWordIndex,
    userInput,
    setUserInput,
    showHint,
    setShowHint,
    currentHint,
    setCurrentHint,
    isLoadingHint,
    setIsLoadingHint,
    showAnswer,
    setShowAnswer,
    floatingEmoji,
    setFloatingEmoji,
    typeAlongVerses,
    setTypeAlongVerses,
    currentVerseIndex,
    setCurrentVerseIndex,
    verseCompletionData,
    setVerseCompletionData,
    hasCompletedFirstVerse,
    setHasCompletedFirstVerse,
    showTypeAlongResults,
    setShowTypeAlongResults,
    verseStartTime,
    setVerseStartTime,
    submittingRef,
    handleWordSubmit,
    handleVerseCompletion,
    renderWordWithMask,
    renderBlankWord,
    renderEnhancedTypingWord
  };

  const flashcardsProps = {
    ...commonProps,
    showFlashcard,
    setShowFlashcard,
    flashcardSide,
    setFlashcardSide,
    currentWordIndex,
    setCurrentWordIndex,
    startChallenge
  };

  const challengeProps = {
    ...commonProps,
    challengeTimeLeft,
    setChallengeTimeLeft,
    challengeActive,
    setChallengeActive,
    currentWordIndex,
    setCurrentWordIndex,
    userInput,
    setUserInput,
    wordsFixed,
    setWordsFixed,
    completeSession
  };

  const scorecardProps = {
    ...commonProps,
    stats,
    weakWords,
    memorizationHistory,
    isLoadingHistory,
    setIsLoadingHistory,
    showHistoryLog,
    setShowHistoryLog,
    setCurrentSession,
    getProgressData,
    startAutoPractice,
    restartRegularPractice
  };

  const completionProps = {
    ...commonProps,
    getProgressData,
    completeSession
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (phase === 'practice' || phase === 'flashcards' || phase === 'challenge' || phase === 'completion') {
                setPhase('summary');
              } else if (phase === 'summary' && currentSession) {
                setCurrentSession(null);
                setPhase('summary');
              } else {
                onBack();
              }
            }}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Syntax Lab</h1>
          <div className="w-32"></div>
        </div>

        {/* Phase Components */}
        {phase === 'summary' && currentSession && (
          <SummaryPhase {...commonProps} startPractice={startPractice} />
        )}

        {phase === 'practice' && currentSession && (
          <PracticePhase {...practiceProps} />
        )}

        {phase === 'flashcards' && (
          <FlashcardsPhase {...flashcardsProps} />
        )}

        {phase === 'challenge' && (
          <ChallengePhase {...challengeProps} />
        )}

        {phase === 'completion' && (
          <CompletionPhase {...completionProps} />
        )}

        {phase === 'scorecard' && stats && (
          <ScorecardPhase {...scorecardProps} />
        )}

        {/* Floating Emoji Animation Overlay */}
        {floatingEmoji && (
          <div
            className="fixed pointer-events-none z-50 transition-all duration-2000 ease-out"
            style={{
              left: `${floatingEmoji.x}px`,
              top: `${floatingEmoji.y}px`,
              transform: 'translate(-50%, -50%)',
              animation: 'floatUp 2s ease-out forwards'
            }}
          >
            <div className="text-6xl animate-bounce">
              {floatingEmoji.emoji}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyntaxLabPageRefactored;
