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

    // Generate some practice words based on accuracy
    const practiceWords: WordComparison[] = [];
    const wordsToGenerate = Math.max(1, Math.round(((100 - historyEntry.bestAccuracy) / 100) * 10));
    
    for (let i = 0; i < wordsToGenerate; i++) {
      practiceWords.push({
        userWord: `word${i}`,
        originalWord: `target${i}`,
        status: 'incorrect' as const,
        position: i,
        suggestion: `target${i}`
      });
    }

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
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-lg leading-relaxed">
                    {currentSession.verse.text.split(' ').map((word, index) => {
                      const currentWord = currentSession.wrongWords[currentWordIndex];
                      if (word.toLowerCase() === currentWord.originalWord.toLowerCase()) {
                        return (
                          <span key={index} className="bg-yellow-200 px-2 py-1 rounded mx-1">
                            {renderWordWithMask(word, currentRound)}
                          </span>
                        );
                      }
                      return <span key={index} className="mx-1">{word}</span>;
                    })}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
                    placeholder="Type the missing word..."
                    className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
                    autoFocus
                  />
                  <button
                    onClick={handleWordSubmit}
                    className="button-primary"
                  >
                    Check Word
                  </button>
                </div>
              </div>
            )}

            {practiceMode === 'type-along' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-lg leading-relaxed">
                    {currentSession.verse.text.split(' ').map((word, index) => {
                      const currentWord = currentSession.wrongWords[currentWordIndex];
                      if (word.toLowerCase() === currentWord.originalWord.toLowerCase()) {
                        return (
                          <span key={index} className="bg-yellow-200 px-2 py-1 rounded mx-1">
                            {renderWordWithMask(word, currentRound)}
                          </span>
                        );
                      }
                      return <span key={index} className="mx-1">{word}</span>;
                    })}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
                    placeholder="Type the word..."
                    className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
                    autoFocus
                  />
                  <button
                    onClick={handleWordSubmit}
                    className="button-primary"
                  >
                    Check Word
                  </button>
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