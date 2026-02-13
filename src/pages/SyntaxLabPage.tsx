import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Target, Zap, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp, Eye, Layers, ChevronRight, Home, AlertCircle, Settings, HelpCircle, Shuffle, Loader2 } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison } from '../types';
import { AIService, WordHintData } from '../services/aiService';

interface SyntaxLabPageProps {
  comparisonResult: ComparisonResult | null;
  onBack: () => void;
  onStartNewSession: () => void;
}

type PracticeMode = 'blank' | 'type-along';
type SessionPhase = 'home' | 'summary' | 'practice' | 'flashcards' | 'challenge' | 'scorecard' | 'all-preview';

// Sample verse data for standalone testing
const SAMPLE_VERSE_TEXT = "For God so loved the world that he gave his only begotten Son that whosoever believeth in him should not perish but have everlasting life";
const SAMPLE_REFERENCE = "John 3:16";

const SAMPLE_COMPARISON_RESULT: ComparisonResult = {
  accuracy: 78,
  totalWords: 25,
  correctWords: 19,
  incorrectWords: 4,
  missingWords: 1,
  extraWords: 1,
  userComparison: [
    { userWord: 'For', originalWord: 'For', status: 'correct', position: 0 },
    { userWord: 'God', originalWord: 'God', status: 'correct', position: 1 },
    { userWord: 'so', originalWord: 'so', status: 'correct', position: 2 },
    { userWord: 'loved', originalWord: 'loved', status: 'correct', position: 3 },
    { userWord: 'the', originalWord: 'the', status: 'correct', position: 4 },
    { userWord: 'world', originalWord: 'world', status: 'correct', position: 5 },
    { userWord: 'that', originalWord: 'that', status: 'correct', position: 6 },
    { userWord: 'he', originalWord: 'he', status: 'correct', position: 7 },
    { userWord: 'give', originalWord: 'gave', status: 'incorrect', position: 8, suggestion: 'gave (past tense)' },
    { userWord: 'his', originalWord: 'his', status: 'correct', position: 9 },
    { userWord: 'only', originalWord: 'only', status: 'correct', position: 10 },
    { userWord: 'begoten', originalWord: 'begotten', status: 'incorrect', position: 11, suggestion: 'begotten (double t)' },
    { userWord: 'Son', originalWord: 'Son', status: 'correct', position: 12 },
    { userWord: 'that', originalWord: 'that', status: 'correct', position: 13 },
    { userWord: 'whoever', originalWord: 'whosoever', status: 'incorrect', position: 14, suggestion: 'whosoever (KJV form)' },
    { userWord: 'believes', originalWord: 'believeth', status: 'incorrect', position: 15, suggestion: 'believeth (KJV form)' },
    { userWord: 'in', originalWord: 'in', status: 'correct', position: 16 },
    { userWord: 'him', originalWord: 'him', status: 'correct', position: 17 },
    { userWord: 'should', originalWord: 'should', status: 'correct', position: 18 },
    { userWord: 'not', originalWord: 'not', status: 'correct', position: 19 },
    { userWord: 'perish', originalWord: 'perish', status: 'correct', position: 20 },
    { userWord: 'but', originalWord: 'but', status: 'correct', position: 21 },
    { userWord: 'have', originalWord: 'have', status: 'correct', position: 22 },
    { userWord: 'eternal', originalWord: 'everlasting', status: 'incorrect', position: 23, suggestion: 'everlasting (KJV uses everlasting)' },
    { userWord: 'life', originalWord: 'life', status: 'correct', position: 24 },
  ],
  originalComparison: [
    { userWord: '', originalWord: 'gave', status: 'missing', position: 8, suggestion: 'gave' },
  ],
  detailedFeedback: 'Good attempt! Focus on KJV-specific word forms like "whosoever", "believeth", and "everlasting".'
};

const SyntaxLabPage: React.FC<SyntaxLabPageProps> = ({ comparisonResult, onBack, onStartNewSession }) => {
  const [phase, setPhase] = useState<SessionPhase>('home');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('blank');
  const [currentSession, setCurrentSession] = useState<SyntaxLabSession | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordsFixed, setWordsFixed] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [flashcardSide, setFlashcardSide] = useState<'front' | 'back'>('front');
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(30);
  const [challengeActive, setChallengeActive] = useState(false);
  const [stats, setStats] = useState<SyntaxLabStats | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [useSampleData, setUseSampleData] = useState(false);
  const [showErrorWarning, setShowErrorWarning] = useState<boolean>(() => {
    const saved = localStorage.getItem('syntaxLabShowErrors');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showFirstLetterHint, setShowFirstLetterHint] = useState<boolean>(() => {
    const saved = localStorage.getItem('syntaxLabShowHint');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hint system state
  const [hintStage, setHintStage] = useState(0); // 0=none, 1=description, 2=scramble, 3=revealed
  const [hintData, setHintData] = useState<WordHintData | null>(null);
  const [showHintPopup, setShowHintPopup] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [scrambledWord, setScrambledWord] = useState('');

  // Reset hint state when word changes
  useEffect(() => {
    setHintStage(0);
    setHintData(null);
    setShowHintPopup(false);
    setHintLoading(false);
    setScrambledWord('');
  }, [currentWordIndex, currentRound]);

  // Fisher-Yates shuffle for scrambling
  const scrambleLetters = useCallback((word: string): string => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Make sure it's not the same as original
    const result = arr.join('');
    if (result === word && word.length > 1) return scrambleLetters(word);
    return result;
  }, []);

  // Persist toggles
  const toggleErrorWarning = () => {
    const newVal = !showErrorWarning;
    setShowErrorWarning(newVal);
    localStorage.setItem('syntaxLabShowErrors', JSON.stringify(newVal));
  };

  const toggleFirstLetterHint = () => {
    const newVal = !showFirstLetterHint;
    setShowFirstLetterHint(newVal);
    localStorage.setItem('syntaxLabShowHint', JSON.stringify(newVal));
  };

  // Determine active comparison data (real or sample)
  const activeComparison = useSampleData ? SAMPLE_COMPARISON_RESULT : comparisonResult;

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

  // Build session from comparison data
  const buildSession = (comparison: ComparisonResult): SyntaxLabSession => {
    const wrongWords = [
      ...comparison.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
      ...comparison.originalComparison.filter(w => w.status === 'missing')
    ];

    return {
      id: `session-${Date.now()}`,
      verseId: `verse-${Date.now()}`,
      verse: {
        id: `verse-${Date.now()}`,
        text: useSampleData ? SAMPLE_VERSE_TEXT : comparison.userComparison.map(w => w.originalWord || w.userWord).join(' '),
        reference: useSampleData ? SAMPLE_REFERENCE : 'Current Verse',
        testament: 'NT'
      },
      originalComparison: comparison,
      wrongWords,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: 3,
      wordsFixed: [],
      startTime: new Date(),
      finalAccuracy: comparison.accuracy,
      improvementScore: 0
    };
  };

  // Initialize session when comparison result is available (from memorize page)
  useEffect(() => {
    if (comparisonResult && !currentSession && !useSampleData) {
      setCurrentSession(buildSession(comparisonResult));
    }
  }, [comparisonResult, currentSession, useSampleData]);

  // Challenge timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (challengeActive && challengeTimeLeft > 0) {
      interval = setInterval(() => {
        setChallengeTimeLeft(prev => {
          if (prev <= 1) {
            setChallengeActive(false);
            setPhase('scorecard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [challengeActive, challengeTimeLeft]);

  const initSampleSession = () => {
    setUseSampleData(true);
    const session = buildSession(SAMPLE_COMPARISON_RESULT);
    setCurrentSession(session);
    return session;
  };

  const startPractice = (mode: PracticeMode) => {
    if (!currentSession) {
      initSampleSession();
    }
    setPracticeMode(mode);
    setPhase('practice');
    setCurrentRound(1);
    setWordsFixed([]);
    setCurrentWordIndex(0);
    setUserInput('');
  };

  const goToPhase = (targetPhase: SessionPhase) => {
    if (!currentSession && targetPhase !== 'home') {
      initSampleSession();
    }
    if (targetPhase === 'challenge') {
      setChallengeTimeLeft(30);
      setChallengeActive(true);
    }
    setCurrentWordIndex(0);
    setUserInput('');
    setFlashcardSide('front');
    setPhase(targetPhase);
  };

  const checkWord = (input: string, targetWord: string): boolean => {
    return input.toLowerCase().trim() === targetWord.toLowerCase().trim();
  };

  const handleWordSubmit = (inputOverride?: string) => {
    if (!currentSession) return;

    const value = inputOverride ?? userInput;
    const currentWord = currentSession.wrongWords[currentWordIndex];
    const isCorrect = checkWord(value, currentWord.originalWord);

    if (isCorrect) {
      setSubmitError(null);
      const newWordsFixed = [...wordsFixed, currentWord.originalWord];
      setWordsFixed(newWordsFixed);
      
      updateWeakWords(currentWord, true);
      
      if (currentWordIndex < currentSession.wrongWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setUserInput('');
      } else {
        if (currentRound < currentSession.maxRounds) {
          setCurrentRound(currentRound + 1);
          setCurrentWordIndex(0);
          setUserInput('');
        } else {
          setPhase('flashcards');
        }
      }
    } else {
      setSubmitError(`"${value}" is not correct. Try again!`);
      updateWeakWords(currentWord, false);
    }
  };

  // Auto-check when typed length matches the target word length
  const handleBlankInput = (newValue: string) => {
    setSubmitError(null);
    setUserInput(newValue);

    if (!currentSession) return;
    const targetWord = currentSession.wrongWords[currentWordIndex]?.originalWord;
    if (!targetWord) return;

    // Once typed length reaches target length, auto-submit
    if (newValue.length >= targetWord.length) {
      // Use setTimeout so state updates and the live mask renders the last char first
      setTimeout(() => handleWordSubmit(newValue), 150);
    }
  };

  // Handle hint button press — escalates through 3 stages
  const handleHintPress = async () => {
    if (!currentSession) return;
    const currentWord = currentSession.wrongWords[currentWordIndex];
    if (!currentWord) return;

    const nextStage = hintStage + 1;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SyntaxLabPage.tsx:handleHintPress',message:'Hint pressed',data:{nextStage,hintStage,currentWord:currentWord.originalWord,hasHintData:!!hintData},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (nextStage === 1) {
      // Stage 1: Fetch AI description
      setHintStage(1);
      setShowHintPopup(true);
      if (!hintData) {
        setHintLoading(true);
        try {
          const data = await AIService.getWordHint(
            currentWord.originalWord,
            currentSession.verse.text,
            currentSession.verse.reference
          );
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SyntaxLabPage.tsx:hintResult',message:'Hint data received',data:{keys:Object.keys(data),fallback:data.fallback,soundsLike:data.soundsLike?.substring(0,80)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          setHintData(data);
        } catch {
          setHintData({
            soundsLike: 'Try sounding it out — break it into syllables.',
            modernEquivalent: 'Think about what modern word you would use here.',
            memoryTrick: 'Picture yourself reading this verse aloud — what comes next?',
            verseClue: 'Look at the words before and after the blank for clues.',
            synonyms: [],
            fallback: true,
          });
        } finally {
          setHintLoading(false);
        }
      }
    } else if (nextStage === 2) {
      // Stage 2: Offer scramble or re-show descriptions
      setHintStage(2);
      setShowHintPopup(true);
      setScrambledWord(scrambleLetters(currentWord.originalWord));
    } else if (nextStage >= 3) {
      // Stage 3: Reveal the word and auto-advance
      setHintStage(3);
      setShowHintPopup(false);
      setUserInput(currentWord.originalWord);

      // Don't count as fixed — just advance after delay
      updateWeakWords(currentWord, false);

      setTimeout(() => {
        if (currentWordIndex < currentSession.wrongWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setUserInput('');
        } else {
          if (currentRound < currentSession.maxRounds) {
            setCurrentRound(currentRound + 1);
            setCurrentWordIndex(0);
            setUserInput('');
          } else {
            setPhase('flashcards');
          }
        }
      }, 1500);
    }
  };

  const updateWeakWords = (wordComparison: WordComparison, wasCorrect: boolean) => {
    const existingWordIndex = weakWords.findIndex(w => 
      w.word === wordComparison.userWord && w.originalWord === wordComparison.originalWord
    );

    if (existingWordIndex >= 0) {
      const updatedWeakWords = [...weakWords];
      if (wasCorrect) {
        updatedWeakWords[existingWordIndex].mastered = true;
      } else {
        updatedWeakWords[existingWordIndex].timesWrong++;
        updatedWeakWords[existingWordIndex].lastMissed = new Date();
      }
      setWeakWords(updatedWeakWords);
      localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
    } else if (!wasCorrect) {
      const newWeakWord: WeakWord = {
        id: `weak-${Date.now()}`,
        word: wordComparison.userWord,
        originalWord: wordComparison.originalWord,
        verse: currentSession?.verse.text || '',
        reference: currentSession?.verse.reference || '',
        timesWrong: 1,
        lastMissed: new Date(),
        mastered: false
      };
      const updatedWeakWords = [...weakWords, newWeakWord];
      setWeakWords(updatedWeakWords);
      localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
    }
  };

  // Static mask for preview/flashcard contexts (no live typing)
  const renderWordWithMask = (word: string): string => {
    if (showFirstLetterHint) {
      // Hint on: show first letter + underscores for the rest
      return word.charAt(0) + ' _'.repeat(word.length - 1).trim();
    }
    // Hint off: all underscores
    return '_ '.repeat(word.length).trim();
  };

  // Live mask: replaces underscores with typed characters 1:1 as user types
  const renderLiveMask = (word: string, typed: string): { char: string; isTyped: boolean; isHint: boolean }[] => {
    const result: { char: string; isTyped: boolean; isHint: boolean }[] = [];

    for (let i = 0; i < word.length; i++) {
      if (i < typed.length) {
        // User has typed this position — show their character
        result.push({ char: typed.charAt(i), isTyped: true, isHint: false });
      } else if (showFirstLetterHint && i === 0 && typed.length === 0) {
        // No typing yet and hint is on — show first letter as hint
        result.push({ char: word.charAt(0), isTyped: false, isHint: true });
      } else {
        // Blank underscore
        result.push({ char: '_', isTyped: false, isHint: false });
      }
    }
    return result;
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

    const finalSession = {
      ...currentSession,
      endTime: new Date(),
      wordsFixed,
      improvementScore: Math.round((wordsFixed.length / currentSession.wrongWords.length) * 100)
    };

    const newStats: SyntaxLabStats = {
      totalSessions: (stats?.totalSessions || 0) + 1,
      wordsFixed: (stats?.wordsFixed || 0) + wordsFixed.length,
      averageImprovement: finalSession.improvementScore,
      weakWords: weakWords.filter(w => !w.mastered),
      accuracyTrend: [...(stats?.accuracyTrend || []), finalSession.improvementScore].slice(-10),
      mostMissedTypes: ['connecting words', 'theological terms'],
      streakDays: (stats?.streakDays || 0) + 1
    };

    setStats(newStats);
    localStorage.setItem('syntaxLabStats', JSON.stringify(newStats));
    setPhase('scorecard');
  };

  // Ensure we have a session + stats for scorecard preview
  const ensureScorecardData = () => {
    if (!currentSession) initSampleSession();
    if (!stats) {
      const sampleStats: SyntaxLabStats = {
        totalSessions: 5,
        wordsFixed: 23,
        averageImprovement: 82,
        weakWords: [],
        accuracyTrend: [65, 70, 75, 80, 82],
        mostMissedTypes: ['connecting words', 'theological terms'],
        streakDays: 3
      };
      setStats(sampleStats);
    }
    if (wordsFixed.length === 0) {
      setWordsFixed(['gave', 'begotten', 'whosoever']);
    }
  };

  // Get the active comparison for rendering
  const renderComparison = activeComparison || SAMPLE_COMPARISON_RESULT;
  const renderSession = currentSession || buildSession(SAMPLE_COMPARISON_RESULT);

  // ──────────────────────────────────────────────
  // PHASE: HOME HUB
  // ──────────────────────────────────────────────
  const renderHome = () => {
    const hasRealData = !!comparisonResult;

    const exercises = [
      {
        id: 'summary' as SessionPhase,
        title: 'Results Summary',
        desc: 'View your verse comparison results and word accuracy breakdown',
        icon: <CheckCircle className="w-7 h-7" />,
        gradient: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600',
      },
      {
        id: 'practice' as SessionPhase,
        title: 'Fill in the Blank',
        desc: 'Practice missing words with progressive difficulty across 3 rounds',
        icon: <Target className="w-7 h-7" />,
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-teal-50 border-teal-200',
        iconColor: 'text-teal-600',
        mode: 'blank' as PracticeMode,
      },
      {
        id: 'practice' as SessionPhase,
        title: 'Type-Along Mode',
        desc: 'Type the entire verse and get word-by-word validation feedback',
        icon: <Brain className="w-7 h-7" />,
        gradient: 'from-purple-500 to-violet-600',
        bgLight: 'bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600',
        mode: 'type-along' as PracticeMode,
      },
      {
        id: 'flashcards' as SessionPhase,
        title: 'Flashcard Review',
        desc: 'Quick flip-card review of your challenging words',
        icon: <Layers className="w-7 h-7" />,
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
      },
      {
        id: 'challenge' as SessionPhase,
        title: 'Timed Challenge',
        desc: '30-second speed round — fix as many words as you can',
        icon: <Zap className="w-7 h-7" />,
        gradient: 'from-orange-500 to-red-600',
        bgLight: 'bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600',
      },
      {
        id: 'scorecard' as SessionPhase,
        title: 'Scorecard',
        desc: 'Session stats, progress tracking, and encouragement',
        icon: <Trophy className="w-7 h-7" />,
        gradient: 'from-yellow-500 to-amber-600',
        bgLight: 'bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600',
      },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Data Source Indicator */}
        <div className={`rounded-xl p-4 border ${hasRealData ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${hasRealData ? 'bg-green-100' : 'bg-amber-100'}`}>
              {hasRealData ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Eye className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm ${hasRealData ? 'text-green-800' : 'text-amber-800'}`}>
                {hasRealData ? 'Live Data — Using your memorization results' : 'Test Mode — Using sample verse (John 3:16)'}
              </p>
              <p className={`text-xs ${hasRealData ? 'text-green-600' : 'text-amber-600'}`}>
                {hasRealData
                  ? `Accuracy: ${comparisonResult.accuracy}% • ${comparisonResult.incorrectWords} words to practice`
                  : 'Explore all exercises with sample data. Complete a memorization test for real results.'}
              </p>
            </div>
          </div>
        </div>

        {/* View All Button */}
        <button
          onClick={() => {
            if (!currentSession) initSampleSession();
            ensureScorecardData();
            setPhase('all-preview');
          }}
          className="w-full group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20"
        >
          <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>View All Exercises on One Page</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (ex.mode) {
                  startPractice(ex.mode);
                } else if (ex.id === 'scorecard') {
                  ensureScorecardData();
                  goToPhase('scorecard');
                } else {
                  goToPhase(ex.id);
                }
              }}
              className={`group text-left p-5 rounded-2xl border ${ex.bgLight} hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${ex.gradient} text-white shadow-md`}>
                  {ex.icon}
                </div>
                <ChevronRight className={`w-5 h-5 ${ex.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">{ex.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{ex.desc}</p>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-purple-100 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Your Stats</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="text-xl font-bold text-purple-700">{stats.totalSessions}</div>
                <div className="text-xs text-purple-500">Sessions</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="text-xl font-bold text-green-700">{stats.wordsFixed}</div>
                <div className="text-xs text-green-500">Words Fixed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-xl font-bold text-blue-700">{stats.averageImprovement}%</div>
                <div className="text-xs text-blue-500">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-xl font-bold text-orange-700">{stats.streakDays}</div>
                <div className="text-xs text-orange-500">Day Streak</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // BACK-TO-HOME BUTTON (reusable)
  // ──────────────────────────────────────────────
  const BackToHomeButton = () => (
    <button
      onClick={() => {
        setChallengeActive(false);
        setPhase('home');
      }}
      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors mb-4"
    >
      <Home className="w-4 h-4" />
      <span className="text-sm font-medium">Back to Syntax Lab Home</span>
    </button>
  );

  // ──────────────────────────────────────────────
  // PHASE: SUMMARY
  // ──────────────────────────────────────────────
  const renderSummary = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Results Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{renderComparison.correctWords}</div>
          <div className="text-sm text-green-700">Correct Words</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
          <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">{renderComparison.incorrectWords}</div>
          <div className="text-sm text-red-700">Wrong Words</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-600">{renderComparison.extraWords}</div>
          <div className="text-sm text-yellow-700">Extra Words</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Words to Practice:</h3>
        <div className="flex flex-wrap gap-2">
          {renderSession.wrongWords.map((word, index) => (
            <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              {word.originalWord || word.userWord}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center space-y-6">
        <h3 className="text-xl font-bold text-gray-800">Choose Your Practice Mode:</h3>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => startPractice('blank')}
            className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <Target className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">Fill in the Blank Mode</span>
          </button>
          <button
            onClick={() => startPractice('type-along')}
            className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <Brain className="w-6 h-6 relative z-10 group-hover:pulse transition-transform duration-300" />
            <span className="relative z-10">Type-Along Mode</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // PHASE: PRACTICE (Fill-in-Blank + Type-Along)
  // ──────────────────────────────────────────────
  const renderPractice = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {practiceMode === 'blank' ? 'Fill in the Blank Mode' : 'Type-Along Mode'}
        </h2>
        <div className="text-sm text-gray-600">
          Round {currentRound}/{renderSession.maxRounds} &bull; Word {currentWordIndex + 1}/{renderSession.wrongWords.length}
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentWordIndex + 1) / renderSession.wrongWords.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {practiceMode === 'blank' && (
        <div className="space-y-6">
          {/* Practice Settings Bar */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">Practice Settings</span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <span className="text-sm text-gray-700">Error Warnings</span>
                  <button
                    onClick={toggleErrorWarning}
                    className={`relative w-11 h-6 rounded-full transition-colors ${showErrorWarning ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showErrorWarning ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <span className="text-sm text-gray-700">First Letter Hint</span>
                  <button
                    onClick={toggleFirstLetterHint}
                    className={`relative w-11 h-6 rounded-full transition-colors ${showFirstLetterHint ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showFirstLetterHint ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Verse with live blanks */}
          <div className="bg-gray-50 rounded-xl p-6 text-center overflow-hidden">
            <p className="text-lg leading-loose flex flex-wrap justify-center gap-y-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {renderSession.verse.text.split(' ').map((word, index) => {
                const currentWord = renderSession.wrongWords[currentWordIndex];
                if (currentWord && word.toLowerCase() === currentWord.originalWord.toLowerCase()) {
                  return (
                    <span key={index} className="inline-block font-mono font-bold border-b-2 border-purple-400 px-1 mx-1 tracking-widest">
                      {renderLiveMask(word, userInput).map((item, ci) => (
                        <span
                          key={ci}
                          className={
                            item.isTyped ? 'text-indigo-700' :
                            item.isHint ? 'text-purple-400' :
                            'text-gray-400'
                          }
                        >
                          {item.char}{ci < word.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </span>
                  );
                }
                return <span key={index} className="inline-block mx-1">{word}</span>;
              })}
            </p>
          </div>

          {/* Error warning */}
          {showErrorWarning && submitError && (
            <div className="flex items-center justify-center space-x-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 text-sm font-medium">{submitError}</span>
            </div>
          )}

          {/* Input + submit */}
          <div className="text-center space-y-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => handleBlankInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
              placeholder="Type the missing word..."
              className={`w-full max-w-md p-3 border rounded-lg focus:ring-2 focus:border-transparent text-center text-lg transition-colors ${
                submitError && showErrorWarning
                  ? 'border-red-400 focus:ring-red-400 bg-red-50'
                  : hintStage === 3
                  ? 'border-green-400 focus:ring-green-400 bg-green-50 text-green-700 font-bold'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
              autoFocus
              disabled={hintStage === 3}
            />
            {submitError && showErrorWarning && (
              <p className="text-sm text-gray-400">Fix your word and keep typing to try again</p>
            )}

            {/* Stage 3: Revealed indicator */}
            {hintStage === 3 && (
              <div className="flex items-center justify-center space-x-2 text-green-600 animate-fade-in">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Word revealed — moving to next word...</span>
              </div>
            )}
          </div>

          {/* Hint button — escalating label */}
          {hintStage < 3 && (
            <div className="text-center">
              <button
                onClick={handleHintPress}
                disabled={hintLoading}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  hintStage === 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : hintStage === 1
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                {hintLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <HelpCircle className="w-4 h-4" />
                )}
                <span>
                  {hintStage === 0 && 'Need a Hint?'}
                  {hintStage === 1 && 'Still Stuck?'}
                  {hintStage === 2 && 'Reveal Word'}
                </span>
              </button>
            </div>
          )}

          {/* Hint Popup */}
          {showHintPopup && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-xl p-6 animate-fade-in">
              {/* Stage 1: AI Description */}
              {hintStage === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-amber-800 flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5" />
                      <span>AI Hint</span>
                    </h3>
                    <button
                      onClick={() => setShowHintPopup(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {hintLoading ? (
                    <div className="flex items-center justify-center py-8 space-x-3">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-gray-500">Thinking about this word...</span>
                    </div>
                  ) : hintData ? (
                    <div className="space-y-4">
                      {hintData.soundsLike && (
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Sounds Like</p>
                          <p className="text-indigo-900 text-sm">{hintData.soundsLike}</p>
                        </div>
                      )}
                      {hintData.verseClue && (
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Verse Clue</p>
                          <p className="text-purple-900 text-sm">{hintData.verseClue}</p>
                        </div>
                      )}
                      {hintData.modernEquivalent && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Modern Equivalent</p>
                          <p className="text-gray-800 text-sm">{hintData.modernEquivalent}</p>
                        </div>
                      )}
                      {hintData.memoryTrick && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Memory Trick</p>
                          <p className="text-amber-800 text-sm">{hintData.memoryTrick}</p>
                        </div>
                      )}
                      {hintData.synonyms.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Similar Words</p>
                          <div className="flex flex-wrap gap-2">
                            {hintData.synonyms.map((s, i) => (
                              <span key={i} className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowHintPopup(false)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                    >
                      Got it, let me try
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Scramble or re-show */}
              {hintStage === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-orange-800 flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5" />
                      <span>Still need help?</span>
                    </h3>
                    <button
                      onClick={() => setShowHintPopup(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    I can show you the descriptions again, or give you the scrambled letters to unscramble.
                  </p>

                  {/* Scrambled letters display */}
                  {scrambledWord && (
                    <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shuffle className="w-4 h-4 text-orange-600" />
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Scrambled Letters</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {scrambledWord.split('').map((letter, i) => (
                          <span
                            key={i}
                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-orange-300 rounded-lg text-lg font-bold text-orange-700 shadow-sm"
                          >
                            {letter}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-show hints */}
                  {hintData && (
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm text-amber-700 font-medium hover:text-amber-800">
                        Show hints again
                      </summary>
                      <div className="mt-3 space-y-3 pl-2 border-l-2 border-amber-200">
                        {hintData.soundsLike && (
                          <div>
                            <p className="text-xs font-semibold text-indigo-600">Sounds Like</p>
                            <p className="text-gray-700 text-sm">{hintData.soundsLike}</p>
                          </div>
                        )}
                        {hintData.verseClue && (
                          <div>
                            <p className="text-xs font-semibold text-purple-600">Verse Clue</p>
                            <p className="text-gray-700 text-sm">{hintData.verseClue}</p>
                          </div>
                        )}
                        {hintData.memoryTrick && (
                          <div>
                            <p className="text-xs font-semibold text-amber-600">Memory Trick</p>
                            <p className="text-gray-700 text-sm">{hintData.memoryTrick}</p>
                          </div>
                        )}
                        {hintData.synonyms.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500">Similar Words</p>
                            <div className="flex flex-wrap gap-1">
                              {hintData.synonyms.map((s, i) => (
                                <span key={i} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setScrambledWord(scrambleLetters(renderSession.wrongWords[currentWordIndex]?.originalWord || ''))}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium inline-flex items-center space-x-1"
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Re-scramble</span>
                    </button>
                    <button
                      onClick={() => setShowHintPopup(false)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                    >
                      Let me try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {practiceMode === 'type-along' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-lg leading-relaxed text-center mb-4">
              {renderSession.verse.text}
            </p>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the entire verse..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
            />
          </div>
          <div className="text-center">
            <button onClick={() => handleWordSubmit()} className="button-primary">
              Check Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ──────────────────────────────────────────────
  // PHASE: FLASHCARDS
  // ──────────────────────────────────────────────
  const renderFlashcards = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Quick Review Cards</h2>
      
      <div className="max-w-md mx-auto">
        <div 
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all min-h-48 flex items-center justify-center"
          onClick={() => setFlashcardSide(flashcardSide === 'front' ? 'back' : 'front')}
        >
          {flashcardSide === 'front' ? (
            <div className="text-center">
              <p className="text-2xl font-mono mb-4">
                {renderWordWithMask(renderSession.wrongWords[currentWordIndex]?.originalWord || '')}
              </p>
              <p className="text-sm text-gray-600">Click to reveal</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 mb-2">
                {renderSession.wrongWords[currentWordIndex]?.originalWord}
              </p>
              <p className="text-sm text-gray-600">
                {renderSession.wrongWords[currentWordIndex]?.suggestion}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            onClick={() => { setCurrentWordIndex(Math.max(0, currentWordIndex - 1)); setFlashcardSide('front'); }}
            disabled={currentWordIndex === 0}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-gray-500">
            {currentWordIndex + 1} / {renderSession.wrongWords.length}
          </span>
          {currentWordIndex < renderSession.wrongWords.length - 1 ? (
            <button
              onClick={() => { setCurrentWordIndex(currentWordIndex + 1); setFlashcardSide('front'); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={startChallenge}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // PHASE: CHALLENGE
  // ──────────────────────────────────────────────
  const renderChallenge = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Timed Challenge</h2>
        <div className="text-3xl font-bold text-red-600 mb-2">{challengeTimeLeft}s</div>
        <p className="text-gray-600">Fix as many words as you can!</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-lg text-center">
            Word {currentWordIndex + 1}: <span className="font-bold text-purple-600">
              {renderWordWithMask(renderSession.wrongWords[currentWordIndex]?.originalWord || '')}
            </span>
          </p>
        </div>
        
        <div className="text-center">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
            placeholder="Quick! Type the word..."
            className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg"
            autoFocus
            disabled={!challengeActive}
          />
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // PHASE: SCORECARD
  // ──────────────────────────────────────────────
  const renderScorecard = () => {
    const displayStats = stats || {
      totalSessions: 5, wordsFixed: 23, averageImprovement: 82,
      weakWords: [], accuracyTrend: [65, 70, 75, 80, 82],
      mostMissedTypes: ['connecting words', 'theological terms'], streakDays: 3
    };
    const displayWordsFixed = wordsFixed.length > 0 ? wordsFixed : ['gave', 'begotten', 'whosoever'];
    const totalWrong = renderSession.wrongWords.length;

    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-gray-600">Here's how you did:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">{displayWordsFixed.length}/{totalWrong}</div>
            <div className="text-green-700">Mistakes Fixed</div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{Math.round((displayWordsFixed.length / totalWrong) * 100)}%</div>
            <div className="text-blue-700">Improvement Score</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-200">
          <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Your Progress
          </h3>
          <div className="space-y-2 text-sm">
            <p>&bull; Total sessions completed: <span className="font-semibold">{displayStats.totalSessions}</span></p>
            <p>&bull; Words mastered this week: <span className="font-semibold">{displayStats.wordsFixed}</span></p>
            <p>&bull; Current streak: <span className="font-semibold">{displayStats.streakDays} days</span></p>
            <p>&bull; Most missed type: <span className="font-semibold">{displayStats.mostMissedTypes[0]}</span></p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 mb-8 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Encouragement</h4>
              <p className="text-yellow-700 text-sm">
                You mastered {displayWordsFixed.length} challenging words today — keep it up!
                {displayWordsFixed.length >= totalWrong * 0.8 && " You're becoming a Scripture master!"}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={onStartNewSession}
            className="button-primary flex items-center space-x-2 mx-auto"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice New Verse</span>
          </button>
          
          <button
            onClick={() => setPhase('home')}
            className="button-secondary flex items-center space-x-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            <span>Back to Syntax Lab Home</span>
          </button>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // PHASE: ALL-PREVIEW (every section on one page)
  // ──────────────────────────────────────────────
  const renderAllPreview = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
        <p className="text-indigo-700 font-semibold text-sm">
          All Exercises Preview — Scroll to view each section
        </p>
        <p className="text-indigo-500 text-xs mt-1">Using: {renderSession.verse.reference}</p>
      </div>

      {/* Section 1: Summary */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">1</span>
          <h3 className="font-bold text-gray-700">Results Summary</h3>
        </div>
        {renderSummary()}
      </div>

      {/* Section 2: Fill in the Blank */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">2</span>
          <h3 className="font-bold text-gray-700">Fill in the Blank</h3>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-teal-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Fill in the Blank Mode</h2>
            <div className="text-sm text-gray-500">Round 1/3 &bull; Word 1/{renderSession.wrongWords.length}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center overflow-hidden mb-4">
            <p className="text-lg leading-loose flex flex-wrap justify-center gap-y-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {renderSession.verse.text.split(' ').map((word, index) => {
                const firstWrong = renderSession.wrongWords[0];
                if (firstWrong && word.toLowerCase() === firstWrong.originalWord.toLowerCase()) {
                  return (
                    <span key={index} className="inline-block text-purple-600 font-mono font-bold border-b-2 border-purple-400 px-1 mx-1 tracking-widest">
                      {renderWordWithMask(word)}
                    </span>
                  );
                }
                return <span key={index} className="inline-block mx-1">{word}</span>;
              })}
            </p>
          </div>
          <div className="text-center">
            <input
              type="text"
              placeholder="Type the missing word..."
              className="w-full max-w-md p-3 border border-gray-300 rounded-lg text-center text-lg"
              disabled
            />
            <p className="text-xs text-gray-400 mt-2">Navigate to this exercise from home to interact</p>
          </div>
        </div>
      </div>

      {/* Section 3: Type-Along */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">3</span>
          <h3 className="font-bold text-gray-700">Type-Along Mode</h3>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Type-Along Mode</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-lg leading-relaxed text-center mb-4">{renderSession.verse.text}</p>
            <textarea
              placeholder="Type the entire verse..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none"
              rows={3}
              disabled
            />
            <p className="text-xs text-gray-400 mt-2 text-center">Navigate to this exercise from home to interact</p>
          </div>
        </div>
      </div>

      {/* Section 4: Flashcards */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">4</span>
          <h3 className="font-bold text-gray-700">Flashcard Review</h3>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Quick Review Cards</h2>
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 min-h-48 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-mono mb-4">
                  {renderWordWithMask(renderSession.wrongWords[0]?.originalWord || '')}
                </p>
                <p className="text-sm text-gray-600">Click to reveal</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button disabled className="px-4 py-2 text-gray-400 border border-gray-200 rounded-lg">Previous</button>
              <span className="flex items-center text-sm text-gray-400">1 / {renderSession.wrongWords.length}</span>
              <button disabled className="px-4 py-2 bg-purple-300 text-white rounded-lg">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Timed Challenge */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">5</span>
          <h3 className="font-bold text-gray-700">Timed Challenge</h3>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-orange-200">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Timed Challenge</h2>
            <div className="text-3xl font-bold text-red-400 mb-2">30s</div>
            <p className="text-gray-500">Fix as many words as you can!</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-lg">
              Word 1: <span className="font-bold text-purple-400">
                {renderWordWithMask(renderSession.wrongWords[0]?.originalWord || '')}
              </span>
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Navigate to this exercise from home to interact</p>
        </div>
      </div>

      {/* Section 6: Scorecard */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="bg-yellow-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">6</span>
          <h3 className="font-bold text-gray-700">Scorecard</h3>
        </div>
        {renderScorecard()}
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={phase === 'home' ? onBack : () => { setChallengeActive(false); setPhase('home'); }}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{phase === 'home' ? 'Back to Memorization' : 'Syntax Lab Home'}</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Syntax Lab</h1>
            <p className="text-gray-600 text-sm">Master your challenging words</p>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Phase-based breadcrumb (when not on home) */}
        {phase !== 'home' && phase !== 'all-preview' && <BackToHomeButton />}
        {phase === 'all-preview' && <BackToHomeButton />}

        {/* Render active phase */}
        {phase === 'home' && renderHome()}
        {phase === 'summary' && renderSummary()}
        {phase === 'practice' && renderPractice()}
        {phase === 'flashcards' && renderFlashcards()}
        {phase === 'challenge' && renderChallenge()}
        {phase === 'scorecard' && renderScorecard()}
        {phase === 'all-preview' && renderAllPreview()}
      </div>
    </div>
  );
};

export default SyntaxLabPage;
