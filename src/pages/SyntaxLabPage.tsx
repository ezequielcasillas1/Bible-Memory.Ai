import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RotateCcw, Target, Zap, Clock, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp, History, Calendar, BarChart3 } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison, MemorizationHistory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryService } from '../services/historyService';

interface SyntaxLabPageProps {
  comparisonResult: ComparisonResult | null;
  onBack: () => void;
  onStartNewSession: () => void;
}

type PracticeMode = 'blank' | 'type-along';
type SessionPhase = 'summary' | 'practice' | 'flashcards' | 'challenge' | 'scorecard';

const SyntaxLabPage: React.FC<SyntaxLabPageProps> = ({ comparisonResult, onBack, onStartNewSession }) => {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<SessionPhase>('summary');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('blank');
  const [currentSession, setCurrentSession] = useState<SyntaxLabSession | null>(null);
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
      const wrongWords = [
        ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
        ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
      ];

      const session: SyntaxLabSession = {
        id: `session-${Date.now()}`,
        startTime: new Date(),
        verseId: `verse-${Date.now()}`,
        verse: {
          id: `verse-${Date.now()}`,
          text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
          reference: "John 3:16",
          testament: "NT" as const
        },
        originalComparison: comparisonResult,
        wrongWords,
        practiceMode: 'blank',
        currentRound: 1,
        maxRounds: 3,
        wordsFixed: [],
        finalAccuracy: 0,
        improvementScore: 0
      };

      setCurrentSession(session);
    }
  }, [comparisonResult, currentSession]);

  // Load memorization history
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

  // Create a practice session from history entry
  const startPracticeFromHistory = (historyEntry: MemorizationHistory) => {
    // Create a mock comparison result based on the history entry's accuracy
    const mockComparisonResult: ComparisonResult = {
      accuracy: historyEntry.bestAccuracy,
      totalWords: 20, // Approximate
      correctWords: Math.round((historyEntry.bestAccuracy / 100) * 20),
      incorrectWords: Math.round(((100 - historyEntry.bestAccuracy) / 100) * 20),
      missingWords: 0,
      extraWords: 0,
      userComparison: [],
      originalComparison: [],
      detailedFeedback: `Practice session for ${historyEntry.verse.reference}`
    };

    // Extract actual words from the verse for practice
    const verseWords = historyEntry.verse.text.split(' ').filter(word => word.length > 2); // Skip short words like "a", "to"
    const wordsToGenerate = Math.max(3, Math.min(verseWords.length, Math.round(((100 - historyEntry.bestAccuracy) / 100) * 8)));
    
    // Randomly select words from the verse for practice
    const shuffledWords = [...verseWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, wordsToGenerate);
    
    const practiceWords: WordComparison[] = selectedWords.map((word, i) => ({
      userWord: '', // User hasn't typed anything yet
      originalWord: word.replace(/[.,!?;:"']/g, ''), // Clean punctuation
      status: 'incorrect' as const,
      position: i,
      suggestion: word.replace(/[.,!?;:"']/g, '')
    }));

    const newSession: SyntaxLabSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      verseId: historyEntry.verse.id,
      verse: historyEntry.verse,
      originalComparison: mockComparisonResult,
      wrongWords: practiceWords,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: 3,
      wordsFixed: [],
      improvementScore: 0,
      finalAccuracy: 0
    };

    setCurrentSession(newSession);
    setPhase('summary');
    setShowHistoryLog(false);
  };

  // Challenge timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (challengeActive && challengeTimeLeft > 0) {
      interval = setInterval(() => {
        setChallengeTimeLeft(prev => {
          if (prev <= 1) {
            setChallengeActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [challengeActive, challengeTimeLeft]);

  const checkWord = (input: string, targetWord: string): boolean => {
    return input.toLowerCase().trim() === targetWord.toLowerCase().trim();
  };

  const handleWordSubmit = () => {
    if (!currentSession || !userInput.trim()) return;

    const currentWord = currentSession.wrongWords[currentWordIndex];
    const isCorrect = checkWord(userInput, currentWord.originalWord);

    if (isCorrect) {
      const newWordsFixed = [...wordsFixed, currentWord.originalWord];
      setWordsFixed(newWordsFixed);
      setShowHint(false); // Reset hint for next word
      
      // Track weak word improvement
      const existingWeakWord = weakWords.find(w => w.word === currentWord.originalWord);
      if (existingWeakWord) {
        existingWeakWord.timesCorrect += 1;
        if (existingWeakWord.timesCorrect >= 3) {
          existingWeakWord.mastered = true;
        }
        const updatedWeakWords = weakWords.map(w => 
          w.word === currentWord.originalWord ? existingWeakWord : w
        );
        setWeakWords(updatedWeakWords);
        localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
      }
        } else {
      // Add to weak words if not already there
      const existingWeakWord = weakWords.find(w => w.word === currentWord.originalWord);
      if (!existingWeakWord) {
        const newWeakWord: WeakWord = {
          id: Date.now().toString(),
          word: currentWord.originalWord,
          originalWord: currentWord.originalWord,
          verse: comparisonResult?.originalComparison[0]?.verse || 'Unknown',
          reference: 'Unknown Reference',
          timesWrong: 1,
          timesCorrect: 0,
          lastMissed: new Date(),
          mastered: false
        };
        const updatedWeakWords = [...weakWords, newWeakWord];
        setWeakWords(updatedWeakWords);
        localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
          } else {
        existingWeakWord.timesWrong += 1;
        existingWeakWord.lastMissed = new Date();
        existingWeakWord.mastered = false;
        const updatedWeakWords = weakWords.map(w => 
          w.word === currentWord.originalWord ? existingWeakWord : w
        );
        setWeakWords(updatedWeakWords);
        localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
      }
    }
        
        if (currentWordIndex < currentSession.wrongWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setUserInput('');
        } else {
      // End of round
          if (currentRound < currentSession.maxRounds) {
            setCurrentRound(currentRound + 1);
            setCurrentWordIndex(0);
            setUserInput('');
          } else {
            setPhase('flashcards');
          }
      return;
    }
  };

  const renderWordWithMask = (word: string, round: number): string => {
    if (round === 1) return word;
    if (round === 2) {
      const visibleChars = Math.ceil(word.length * 0.4);
      return word.substring(0, visibleChars) + '_'.repeat(word.length - visibleChars);
    }
    return '_'.repeat(word.length);
  };

  // Create proper blank for Fill-in-the-Blank mode
  const renderBlankWord = (word: string): string => {
    return '____'; // Always show blank, no hints
  };

  // Generate hint for word (first letter + sound description)
  const generateHint = (word: string): string => {
    if (!word) return '';
    const firstLetter = word.charAt(0).toUpperCase();
    const soundHints: Record<string, string> = {
      'world': 'sounds like "whirled"',
      'God': 'sounds like "gawd"', 
      'loved': 'sounds like "luvd"',
      'gave': 'sounds like "gayv"',
      'believes': 'sounds like "bee-leevs"'
    };
    const soundHint = soundHints[word.toLowerCase()] || `sounds like "${word.toLowerCase()}"`;
    return `Starts with "${firstLetter}" and ${soundHint}`;
  };

  // Enhanced Type-Along Mode helper functions
  const renderEnhancedTypingWord = (originalWord: string, userInput: string, round: number) => {
    const chars = originalWord.split('');
    const userChars = userInput.split('');
    
    return chars.map((char, index) => {
      const userChar = userChars[index];
      let className = 'transition-all duration-200 ';
      
      if (index < userInput.length) {
        // User has typed this position
        if (userChar?.toLowerCase() === char.toLowerCase()) {
          className += 'text-green-300 bg-green-600/20 rounded px-1';
        } else {
          className += 'text-red-300 bg-red-600/20 rounded px-1';
        }
      } else if (index === userInput.length) {
        // Current typing position
        className += 'text-yellow-300 bg-yellow-600/30 rounded px-1 animate-pulse';
    } else {
        // Not yet typed
        className += 'text-white/70';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const getTypingAccuracy = (userInput: string, targetWord: string) => {
    if (!userInput || !targetWord) return 0;
    
    const userLower = userInput.toLowerCase();
    const targetLower = targetWord.toLowerCase();
    
    // Calculate character-by-character accuracy
    let correctChars = 0;
    const minLength = Math.min(userInput.length, targetWord.length);
    
    for (let i = 0; i < minLength; i++) {
      if (userLower[i] === targetLower[i]) {
        correctChars++;
      }
    }
    
    // Bonus for complete word match
    if (userLower === targetLower) {
      return 1.0;
    }
    
    // Calculate accuracy based on correct characters vs target length
    return correctChars / targetWord.length;
  };

  const startPractice = (mode: PracticeMode) => {
    setPracticeMode(mode);
    setPhase('practice');
    setCurrentWordIndex(0);
    setUserInput('');
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
      finalAccuracy: (wordsFixed.length / currentSession.wrongWords.length) * 100,
      improvementScore: Math.min(100, (wordsFixed.length / currentSession.wrongWords.length) * 100 + 10)
    };

    // Update stats
    const newStats: SyntaxLabStats = {
      totalSessions: (stats?.totalSessions || 0) + 1,
      wordsFixed: (stats?.wordsFixed || 0) + wordsFixed.length,
      averageImprovement: stats?.averageImprovement || 0,
      averageAccuracy: stats ? 
        ((stats.averageAccuracy * stats.totalSessions) + finalSession.finalAccuracy) / (stats.totalSessions + 1) :
        finalSession.finalAccuracy,
      totalTimeSpent: (stats?.totalTimeSpent || 0) + ((finalSession.endTime!.getTime() - finalSession.startTime.getTime()) / 1000 / 60),
      weakWords: weakWords,
      accuracyTrend: [...(stats?.accuracyTrend || []), finalSession.improvementScore].slice(-10),
      mostMissedTypes: ['connecting words', 'theological terms'],
      streakDays: (stats?.streakDays || 0) + 1
    };

    setStats(newStats);
    localStorage.setItem('syntaxLabStats', JSON.stringify(newStats));
    setPhase('scorecard');
  };

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
            <div className="w-16"></div>
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
                </div>
              </div>
            </div>
          ) : (
            /* History Log Display */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg blur opacity-30"></div>
                      <History className="w-8 h-8 text-emerald-600 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">📚 Your Memorization History</h2>
                  </div>
                  <button
                    onClick={() => setShowHistoryLog(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {memorizationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No History Yet</h3>
                    <p className="text-gray-500 mb-6">Start memorizing verses to build your practice history!</p>
          <button
            onClick={onStartNewSession}
            className="button-primary flex items-center space-x-2 mx-auto"
          >
            <BookOpen className="w-4 h-4" />
            <span>Start Memorizing</span>
          </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memorizationHistory.slice(0, 12).map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                        onClick={() => startPracticeFromHistory(entry)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-cyan-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'mastered' ? 'bg-green-100 text-green-700' :
                              entry.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {entry.status === 'mastered' ? '🏆 Mastered' :
                               entry.status === 'reviewing' ? '📖 Reviewing' :
                               '📚 Learning'}
                            </div>
                            <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                          </div>

                          <h3 className="font-bold text-gray-800 mb-2 text-lg">
                            {entry.verse.reference}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {entry.verse.text.substring(0, 100)}...
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-600">
                                {Math.round(entry.bestAccuracy)}%
                              </div>
                              <div className="text-xs text-gray-500">Best Score</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {entry.attempts}
                              </div>
                              <div className="text-xs text-gray-500">Attempts</div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 text-center">
                            Last practiced: {entry.lastPracticed.toLocaleDateString()}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              if (phase === 'practice' || phase === 'flashcards' || phase === 'challenge') {
                setPhase('summary'); // Go back to training menu instead of memorization
              } else {
                onBack(); // Only go back to memorization from summary
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

        {/* Phase: Summary */}
        {phase === 'summary' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Results Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{comparisonResult?.correctWords || 0}</div>
                <div className="text-sm text-green-700">Correct Words</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{comparisonResult?.incorrectWords || 0}</div>
                <div className="text-sm text-red-700">Wrong Words</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{comparisonResult?.extraWords || 0}</div>
                <div className="text-sm text-yellow-700">Extra Words</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Words to Practice:</h3>
              <div className="flex flex-wrap gap-2">
                {currentSession.wrongWords.map((word, index) => (
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
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">🎯 Fill in the Blank Mode</span>
                </button>
                <button
                  onClick={() => startPractice('type-along')}
                  className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <Brain className="w-6 h-6 relative z-10 group-hover:pulse transition-transform duration-300" />
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">🧠 Type-Along Mode</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Practice */}
        {phase === 'practice' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {practiceMode === 'blank' ? 'Fill in the Blank Mode' : 'Type-Along Mode'}
              </h2>
              <div className="text-sm text-gray-600">
                Round {currentRound}/{currentSession.maxRounds} • Word {currentWordIndex + 1}/{currentSession.wrongWords.length}
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentWordIndex + 1) / currentSession.wrongWords.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {practiceMode === 'blank' && (
              <div className="space-y-8">
                {/* Enhanced Fill-in-the-Blank Display */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-2">🎯 Fill in the Blank Practice</h3>
                    <p className="text-sm text-emerald-600">Fill in the highlighted blanks. Watch your progress!</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-inner border border-emerald-100 overflow-hidden">
                    <div className="text-xl leading-relaxed text-center font-medium break-words overflow-wrap-anywhere max-w-full">
                      {currentSession.verse.text.split(' ').map((word, index) => {
                        const currentWord = currentSession.wrongWords[currentWordIndex];
                        const isCurrentTargetWord = word.toLowerCase() === currentWord.originalWord.toLowerCase();
                        const isWordCompleted = wordsFixed.includes(currentWord.originalWord.toLowerCase());
                        
                        if (isCurrentTargetWord) {
                          // Show proper blank for fill-in-the-blank mode
                          return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-sm opacity-30 animate-pulse"></span>
                              <span className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                                {renderBlankWord(word)}
                              </span>
                            </span>
                          );
                        } else if (isWordCompleted) {
                          // Completed words get success styling
                          return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-lg font-medium shadow-md">
                                {word}
                              </span>
                              <span className="absolute -top-1 -right-1 text-green-500 animate-bounce">✓</span>
                            </span>
                          );
                        }
                        
                        // Regular words
                        return (
                          <span key={index} className="mx-1 text-gray-700 transition-all duration-300 hover:text-emerald-600">
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Enhanced Input Section */}
                <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-emerald-200">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Fill in the missing word:
                      </h4>
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-full transition-colors duration-200"
                        >
                          💡 {showHint ? 'Hide Hint' : 'Get Hint'}
                        </button>
                      </div>
                      {showHint && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                          <strong>Hint:</strong> {generateHint(currentSession.wrongWords[currentWordIndex]?.originalWord || '')}
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced input with better styling */}
                    <div className="relative max-w-lg mx-auto">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
                        placeholder="Type the missing word..."
                        className="w-full p-4 text-xl text-center border-3 border-emerald-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 bg-gradient-to-r from-emerald-50 to-teal-50 font-medium shadow-lg"
                        autoFocus
                      />
                    </div>

                    {/* Enhanced submit button */}
                    <button
                      onClick={handleWordSubmit}
                      disabled={!userInput.trim()}
                      className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <Target className="w-5 h-5 group-hover:animate-spin" />
                        <span>Check Word</span>
                        <span className="text-sm opacity-75">(Enter ↵)</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Progress: {wordsFixed.length} / {currentSession.wrongWords.length} words
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {Math.round((wordsFixed.length / currentSession.wrongWords.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-3 mt-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${(wordsFixed.length / currentSession.wrongWords.length) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {practiceMode === 'type-along' && (
              <div className="space-y-8">
                {/* Enhanced Verse Display with Real-time Typing */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-2">🧠 Type-Along Practice</h3>
                    <p className="text-sm text-indigo-600">Type each word as it appears. Watch the real-time feedback!</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-inner border border-indigo-100 overflow-hidden">
                    <p className="text-xl leading-relaxed text-center font-medium break-words overflow-wrap-anywhere max-w-full">
                      {currentSession.verse.text.split(' ').map((word, index) => {
                        const currentWord = currentSession.wrongWords[currentWordIndex];
                        const isCurrentTargetWord = word.toLowerCase() === currentWord.originalWord.toLowerCase();
                        const isWordCompleted = wordsFixed.includes(currentWord.originalWord.toLowerCase());
                        
                        if (isCurrentTargetWord) {
                          // Enhanced current word display with typing feedback
                      return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg blur-sm opacity-30 animate-pulse"></span>
                              <span className="relative bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                                {renderEnhancedTypingWord(word, userInput, currentRound)}
                              </span>
                        </span>
                      );
                        } else if (isWordCompleted) {
                          // Completed words get success styling
                          return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-lg font-medium shadow-md">
                                {word}
                              </span>
                              <span className="absolute -top-1 -right-1 text-green-500 animate-bounce">✓</span>
                            </span>
                          );
                        }
                        
                        // Regular words
                        return (
                          <span key={index} className="mx-1 text-gray-700 transition-all duration-300 hover:text-indigo-600">
                            {word}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>

                {/* Enhanced Input Section */}
                <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-200">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Type the highlighted word:
                    </h4>
                      <p className="text-sm text-gray-600">
                        Target: <span className="font-bold text-purple-600">{currentSession.wrongWords[currentWordIndex]?.originalWord}</span>
                    </p>
                  </div>
                  
                    {/* Real-time typing input with enhanced styling */}
                    <div className="relative max-w-lg mx-auto">
                      <input
                        type="text"
                    value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
                        placeholder="Start typing the word..."
                        className="w-full p-4 text-xl text-center border-3 border-purple-300 rounded-2xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 bg-gradient-to-r from-purple-50 to-indigo-50 font-medium shadow-lg"
                    autoFocus
                  />
                  
                      {/* Real-time typing feedback indicator */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        {userInput && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                            getTypingAccuracy(userInput, currentSession.wrongWords[currentWordIndex]?.originalWord) > 0.8
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : getTypingAccuracy(userInput, currentSession.wrongWords[currentWordIndex]?.originalWord) > 0.5
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {Math.round(getTypingAccuracy(userInput, currentSession.wrongWords[currentWordIndex]?.originalWord) * 100)}% match
                    </div>
                  )}
                </div>
                    </div>
                    
                    {/* Enhanced submit button */}
                  <button
                    onClick={handleWordSubmit}
                      disabled={!userInput.trim()}
                      className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <Brain className="w-5 h-5 group-hover:animate-pulse" />
                        <span>Check Word</span>
                        <span className="text-sm opacity-75">(Enter ↵)</span>
                      </span>
                  </button>
                </div>
              </div>

                {/* Progress indicator */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Progress: {wordsFixed.length} / {currentSession.wrongWords.length} words
                    </span>
                    <span className="text-purple-600 font-bold">
                      {Math.round((wordsFixed.length / currentSession.wrongWords.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3 mt-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${(wordsFixed.length / currentSession.wrongWords.length) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                      </div>
                      </div>
                  </div>
                  </div>
                )}
              </div>
        )}

        {/* Phase: Flashcards */}
        {phase === 'flashcards' && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🃏 Flashcard Review</h2>
            
            <div className="text-center space-y-6">
              <p className="text-gray-600">Review the words you practiced with flashcards</p>
              
                  <button
                    onClick={startChallenge}
                className="button-primary flex items-center space-x-2 mx-auto"
                  >
                <Zap className="w-4 h-4" />
                <span>Start Challenge</span>
                  </button>
              </div>
          </div>
        )}

        {/* Phase: Challenge */}
        {phase === 'challenge' && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">⚡ Speed Challenge</h2>
              <div className="text-2xl font-bold text-red-600">
                {challengeTimeLeft}s
            </div>
              </div>

            <div className="text-center space-y-6">
              <p className="text-gray-600">Type the words as fast as you can!</p>
              
              <button
                onClick={completeSession}
                className="button-primary flex items-center space-x-2 mx-auto"
              >
                <Trophy className="w-4 h-4" />
                <span>Complete Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase: Scorecard */}
        {phase === 'scorecard' && stats && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🏆 Session Complete!</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{wordsFixed.length}/{currentSession?.wrongWords.length || 0}</div>
                <div className="text-green-700">Mistakes Fixed</div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{Math.round((wordsFixed.length / (currentSession?.wrongWords.length || 1)) * 100)}%</div>
                <div className="text-blue-700">Improvement Score</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Your Progress
              </h3>
              <div className="space-y-2 text-sm">
                <p>• Total sessions completed: <span className="font-semibold">{stats.totalSessions}</span></p>
                <p>• Words mastered this week: <span className="font-semibold">{stats.wordsFixed}</span></p>
                <p>• Current streak: <span className="font-semibold">{stats.streakDays} days</span></p>
                <p>• Most missed type: <span className="font-semibold">{stats.mostMissedTypes[0]}</span></p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-6 mb-8 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Encouragement</h4>
                  <p className="text-yellow-700 text-sm">
                    You mastered {wordsFixed.length} challenging words today—keep it up! 
                    {wordsFixed.length >= (currentSession?.wrongWords.length || 1) * 0.8 && " You're becoming a Scripture master!"}
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
                onClick={onBack}
                className="button-secondary flex items-center space-x-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Memorization</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyntaxLabPage;