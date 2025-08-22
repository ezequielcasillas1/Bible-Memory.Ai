import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RotateCcw, Target, Zap, Clock, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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
        verseId: `verse-${Date.now()}`,
        verse: {
          id: `verse-${Date.now()}`,
          text: comparisonResult.userComparison.map(w => w.originalWord || w.userWord).join(' '),
          reference: 'Current Verse',
          testament: 'NT'
        },
        originalComparison: comparisonResult,
        wrongWords,
        practiceMode: 'blank',
        currentRound: 1,
        maxRounds: 3,
        wordsFixed: [],
        startTime: new Date(),
        finalAccuracy: comparisonResult.accuracy,
        improvementScore: 0
      };

      setCurrentSession(session);
    }
  }, [comparisonResult, currentSession]);

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

  const startPractice = (mode: PracticeMode) => {
    setPracticeMode(mode);
    setPhase('practice');
    setCurrentRound(1);
    setWordsFixed([]);
    setCurrentWordIndex(0);
    setUserInput('');
  };

  const checkWord = (input: string, targetWord: string): boolean => {
    return input.toLowerCase().trim() === targetWord.toLowerCase().trim();
  };

  const handleWordSubmit = () => {
    if (!currentSession) return;

    const currentWord = currentSession.wrongWords[currentWordIndex];
    const isCorrect = checkWord(userInput, currentWord.originalWord);

    if (isCorrect) {
      const newWordsFixed = [...wordsFixed, currentWord.originalWord];
      setWordsFixed(newWordsFixed);
      
      // Update weak words
      updateWeakWords(currentWord, true);
      
      if (currentWordIndex < currentSession.wrongWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setUserInput('');
      } else {
        // Round complete
        if (currentRound < currentSession.maxRounds) {
          setCurrentRound(currentRound + 1);
          setCurrentWordIndex(0);
          setUserInput('');
        } else {
          setPhase('flashcards');
        }
      }
    } else {
      // Update weak words for incorrect attempt
      updateWeakWords(currentWord, false);
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

  const renderWordWithMask = (word: string, round: number): string => {
    if (round === 1) return word;
    if (round === 2) {
      const visibleChars = Math.ceil(word.length * 0.4);
      return word.substring(0, visibleChars) + '_'.repeat(word.length - visibleChars);
    }
    return '_'.repeat(word.length);
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

    // Update stats
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

  if (!comparisonResult && !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 text-center max-w-md">
          <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Syntax Lab</h2>
          <p className="text-gray-600 mb-6">
            Complete a memorization test first to practice your wrong words in the Syntax Lab.
          </p>
          <button
            onClick={onStartNewSession}
            className="button-primary flex items-center space-x-2 mx-auto"
          >
            <BookOpen className="w-4 h-4" />
            <span>Start Memorizing</span>
          </button>
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
            onClick={onBack}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Memorization</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">📖 Syntax Lab</h1>
            <p className="text-gray-600">Master your challenging words</p>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Phase: Summary */}
        {phase === 'summary' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Results Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{comparisonResult.correctWords}</div>
                <div className="text-sm text-green-700">Correct Words</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{comparisonResult.incorrectWords}</div>
                <div className="text-sm text-red-700">Wrong Words</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{comparisonResult.extraWords}</div>
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

            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Choose Practice Mode:</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => startPractice('blank')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  <span>Blank Mode</span>
                </button>
                <button
                  onClick={() => startPractice('type-along')}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  <span>Type-Along Mode</span>
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
                {practiceMode === 'blank' ? 'Fill in the Blanks' : 'Type Along'}
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
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-lg leading-relaxed text-center mb-4">
                    {currentSession.verse.text}
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
                  <button
                    onClick={handleWordSubmit}
                    className="button-primary"
                  >
                    Check Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: Flashcards */}
        {phase === 'flashcards' && currentSession && (
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
                      {renderWordWithMask(currentSession.wrongWords[currentWordIndex]?.originalWord || '', 2)}
                    </p>
                    <p className="text-sm text-gray-600">Click to reveal</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 mb-2">
                      {currentSession.wrongWords[currentWordIndex]?.originalWord}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentSession.wrongWords[currentWordIndex]?.suggestion}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentWordIndex(Math.max(0, currentWordIndex - 1))}
                  disabled={currentWordIndex === 0}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                {currentWordIndex < currentSession.wrongWords.length - 1 ? (
                  <button
                    onClick={() => setCurrentWordIndex(currentWordIndex + 1)}
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
        )}

        {/* Phase: Challenge */}
        {phase === 'challenge' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">⚡ Timed Challenge</h2>
              <div className="text-3xl font-bold text-red-600 mb-2">{challengeTimeLeft}s</div>
              <p className="text-gray-600">Fix as many words as you can!</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-lg text-center">
                  Word {currentWordIndex + 1}: <span className="font-bold text-purple-600">
                    {renderWordWithMask(currentSession.wrongWords[currentWordIndex]?.originalWord || '', 3)}
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
        )}

        {/* Phase: Scorecard */}
        {phase === 'scorecard' && currentSession && stats && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Complete! 🎉</h2>
              <p className="text-gray-600">Here's how you did:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{wordsFixed.length}/{currentSession.wrongWords.length}</div>
                <div className="text-green-700">Mistakes Fixed</div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{Math.round((wordsFixed.length / currentSession.wrongWords.length) * 100)}%</div>
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
                    {wordsFixed.length >= currentSession.wrongWords.length * 0.8 && " You're becoming a Scripture master!"}
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