import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, History, Bot, Brain, X } from 'lucide-react';
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

const SyntaxLabPage: React.FC<SyntaxLabPageProps> = ({ 
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
        text: sessionData.verseText,
        reference: sessionData.verseReference || 'Custom Verse',
        testament: 'NT' as const
      };

      // TRANSLATION-AWARE FILL-IN-BLANK CREATION
      const verseText = translatedVerseText || selectedVerse?.text || 'Default verse text';
      const fillInBlankState = FillInBlankAPI.createFillInBlankState(verseText, comparisonResult);
      const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);

      const session: SyntaxLabSession = {
        id: sessionData.id,
        verseId: verse.id,
        verse,
        originalComparison: comparisonResult,
        wrongWords,
        practiceMode: 'blank',
        currentRound: 1,
        maxRounds: 3,
        wordsFixed: [],
        startTime: new Date(),
        endTime: undefined,
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
        round: { completed: 0, total: 0, currentWord: 1, percentage: 0 }
      };
    }

    const allWrongWords = currentSession.wrongWords.map(ww => ww.originalWord || ww.userWord);
    const progressionState: RoundProgressionState = {
      currentRound,
      maxRounds: currentSession.maxRounds || 3,
      wordsFixed: wordsFixed,
      currentRoundWords: allWrongWords.slice(0, Math.ceil(allWrongWords.length / (currentSession.maxRounds || 3))),
      totalWords: allWrongWords
    };

    // Use RoundProgressionAPI to get accurate progress data
    const dummyResult = RoundProgressionAPI.processWordSubmission(
      progressionState,
      '', // Empty word for progress calculation only
      false // Not processing actual submission
    );

    return {
      global: {
        completed: dummyResult.progressData.globalProgress.completed,
        total: dummyResult.progressData.globalProgress.total,
        currentWord: Math.min(dummyResult.progressData.globalProgress.completed + 1, dummyResult.progressData.globalProgress.total),
        percentage: dummyResult.progressData.globalProgress.percentage
      },
      round: {
        completed: dummyResult.progressData.roundProgress.completed,
        total: dummyResult.progressData.roundProgress.total,
        currentWord: dummyResult.progressData.roundProgress.currentWordInRound || 1,
        percentage: dummyResult.progressData.roundProgress.percentage
      }
    };
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await HistoryService.getMemorizationHistory();
      setMemorizationHistory(history);
      setShowHistoryLog(true);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startAutoPractice = () => {
    // Predefined sample verses for auto practice
    const sampleVerses: Verse[] = [
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
      }
    ];

    // Pick a random verse
    const randomVerse = sampleVerses[Math.floor(Math.random() * sampleVerses.length)];
    
    // Create a mock comparison result for auto practice
    const mockWords = randomVerse.text.split(' ').slice(0, 3); // Take first 3 words as "wrong"
    const mockComparison: WordComparison[] = mockWords.map((word, index) => ({
      originalWord: word,
      userWord: word + '_wrong',
      status: 'incorrect' as const,
      position: index
    }));

    const mockComparisonResult: ComparisonResult = {
      accuracy: 70,
      totalWords: randomVerse.text.split(' ').length,
      correctWords: randomVerse.text.split(' ').length - 3,
      incorrectWords: 3,
      missingWords: 0,
      extraWords: 0,
      userComparison: mockComparison,
      originalComparison: [],
      detailedFeedback: 'Auto-generated practice session'
    };

    // Create auto session
    const sessionData = SyntaxLabAPI.createSession(mockComparisonResult);
    const wrongWords = mockComparison;

    const fillInBlankState = FillInBlankAPI.createFillInBlankState(randomVerse.text, mockComparisonResult);
    const fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);

    const session: SyntaxLabSession = {
      id: `auto-session-${Date.now()}`,
      verseId: randomVerse.id,
      verse: randomVerse,
      originalComparison: mockComparisonResult,
      wrongWords,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: 3,
      wordsFixed: [],
      startTime: new Date(),
      endTime: undefined,
      fillInBlankResult,
      finalAccuracy: 0,
      improvementScore: 0
    };

    setCurrentSession(session);
    setPhase('summary');
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
    if (submittingRef.current) return; 
    submittingRef.current = true; 
    setTimeout(() => { submittingRef.current = false; }, 250);
    
    if (!currentSession || !userInput.trim()) {
      console.log('🚨 handleWordSubmit: Early exit - no session or input');
      return;
    }

    // Process word submission using FillInBlankAPI directly
    try {
      if (!currentSession.fillInBlankResult) {
        console.log('🚨 handleWordSubmit: No fillInBlankResult in session');
        return;
      }

      // Get current blank word for comparison
      const fillInBlankState = {
        verse: currentSession.verse.text,
        failedWords: currentSession.wrongWords.map(w => w.originalWord || w.userWord),
        completedWords: wordsFixed,
        currentBlankIndex: 0,
        translationContext: displayVerse?.isTranslated ? {
          isTranslated: true,
          originalVerse: currentSession.verse.text,
          translatedVerse: displayVerse.text
        } : undefined
      };

      const result = FillInBlankAPI.processWordSubmission(fillInBlankState, userInput);
      
      console.log('🔍 Word submission result:', {
        isCorrect: result.isCorrect,
        shouldAdvance: result.shouldAdvance,
        currentWord: result.currentWord,
        userInput: userInput
      });
      
      if (result.isCorrect) {
        // Show success animation
        setFloatingEmoji({
          id: `emoji-${Date.now()}`,
          emoji: '✅',
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
        setTimeout(() => setFloatingEmoji(null), 2000);
        
        // Update words fixed for round progression integration
        const newWordsFixed = [...wordsFixed, result.currentWord || ''];
        setWordsFixed(newWordsFixed);
        
        // Reset UI state
        setShowHint(false);
        setCurrentHint('');
        setShowAnswer(false);
        setUserInput('');
        
        // Check if session is completed
        const updatedState = { ...fillInBlankState, completedWords: newWordsFixed };
        if (FillInBlankAPI.isCompleted(updatedState)) {
          console.log('🎉 Fill-in-blank session completed!');
          setPhase('completion');
          return;
        }
        
      } else {
        // Show error animation
        setFloatingEmoji({
          id: `emoji-${Date.now()}`,
          emoji: '❌',
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
        setTimeout(() => setFloatingEmoji(null), 2000);
      }
      
    } catch (error) {
      console.error('🚨 handleWordSubmit error:', error);
    }
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
    renderEnhancedTypingWord,
    getProgressData
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

  // Show welcome menu when no comparison result and no current session
  if (!comparisonResult && !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">📖 Syntax Lab</h1>
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Close Syntax Lab"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showHistoryLog ? (
            /* Welcome Screen */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-3xl p-12 shadow-2xl border border-purple-200 text-center max-w-2xl">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full blur-2xl opacity-20"></div>
                  <Brain className="w-24 h-24 text-purple-600 mx-auto relative z-10" />
                </div>
                
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Syntax Lab</h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Perfect your memorization with targeted practice sessions. Train your weak spots and achieve mastery.
                </p>

                <div className="space-y-4">
                  <button
                    onClick={onStartNewSession}
                    className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white px-10 py-5 rounded-2xl hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm w-full max-w-md mx-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <BookOpen className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">🚀 Start New Memorization</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <button
                    onClick={loadHistory}
                    disabled={isLoadingHistory}
                    className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-10 py-5 rounded-2xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm w-full max-w-md mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    {isLoadingHistory ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white relative z-10"></div>
                    ) : (
                      <History className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    )}
                    <span className="relative z-10">📚 Practice From History</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <button
                    onClick={startAutoPractice}
                    className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white px-10 py-5 rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm w-full max-w-md mx-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <Bot className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">🤖 Auto Practice</span>
                  </button>
                  
                  <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                    Jump into automatically generated practice sessions with verses and mock exercises—no setup required.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* History Log Display - Placeholder for now */
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Practice History</h2>
                <button
                  onClick={() => setShowHistoryLog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600">History functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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

export default SyntaxLabPage;
