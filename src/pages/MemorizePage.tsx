import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Lightbulb, Brain, Target } from 'lucide-react';
import { Verse, MemorizationSession, Tab } from '../types';
import { useAutoTranslatedVerse } from '../hooks/useAutoTranslatedVerse';
import { AIService } from '../services/aiService';
import { HistoryService } from '../services/historyService';
import { VerseComparisonService, ComparisonResult } from '../services/verseComparisonService';
import { getVersionById } from '../data/bibleVersions';
import { BibleVersion } from '../services/BibleAPI';
import CountdownTimer from '../components/CountdownTimer';

interface MemorizePageProps {
  selectedVerse: Verse | null;
  studyTime: number;
  onComplete: (points: number) => void;
  onBackToGenerator: () => void;
  userStats: any;
  availableBibleVersions: BibleVersion[];
  onComparisonComplete: (result: ComparisonResult | null) => void;
  setActiveTab: (tab: Tab) => void;
}

type MemorizationPhase = 'study' | 'input' | 'feedback';

const MemorizePage: React.FC<MemorizePageProps> = ({ 
  selectedVerse, 
  studyTime, 
  onComplete, 
  onBackToGenerator,
  userStats,
  availableBibleVersions,
  onComparisonComplete,
  setActiveTab
}) => {
  // Use auto-translated verse for display
  const displayVerse = useAutoTranslatedVerse(selectedVerse);
  
  const [phase, setPhase] = useState<MemorizationPhase>('study');
  const [timeLeft, setTimeLeft] = useState(studyTime);
  const [isActive, setIsActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string; suggestion: string } | null>(null);
  const [result, setResult] = useState<{
    accuracy: number;
    feedback: string;
    analysis: string;
    strategies: string[];
    spiritualInsight: string;
    nextSteps: string;
    encouragement: string;
  } | null>(null);
  const [practiceTime, setPracticeTime] = useState(0);

  useEffect(() => {
    if (selectedVerse && !session) {
      setSession({
        verse: selectedVerse,
        startTime: new Date(),
        attempts: 0,
        completed: false,
        accuracy: 0
      });
      setPhase('study');
      setTimeLeft(studyTime);
      setIsActive(false);
    }
  }, [selectedVerse, studyTime, session]);

  // Study timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && phase === 'study') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            setPhase('input');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, phase]);

  // Practice timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'input') {
      interval = setInterval(() => {
        setPracticeTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Loading messages for AI feedback
  const encouragingMessages = [
    "🙏 The Lord is analyzing your heart's work...",
    "✨ God's wisdom is reviewing your faithful effort...",
    "📖 His Word is being treasured in your heart...",
    "💝 Every verse memorized is a gift to your soul...",
    "🌟 The Holy Spirit is preparing personalized guidance...",
    "⭐ Your dedication to Scripture brings Him joy...",
    "🕊️ God sees your commitment to His Word...",
    "💎 You're storing up treasures in heaven...",
    "🌱 His Word is taking root in your heart...",
    "🔥 The Scripture you're learning will never return void...",
    "👑 You're becoming more like Christ through His Word...",
    "🎯 God is preparing the perfect encouragement for you..."
  ];

  // Cycle through encouraging messages during loading
  useEffect(() => {
    if (isLoadingFeedback) {
      let messageIndex = 0;
      setLoadingMessage(encouragingMessages[0]);
      
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % encouragingMessages.length;
        setLoadingMessage(encouragingMessages[messageIndex]);
      }, 2000);
      
      return () => clearInterval(messageInterval);
    }
  }, [isLoadingFeedback]);

  const startStudy = () => {
    setIsActive(true);
    setTimeLeft(studyTime);
  };

  const togglePause = () => {
    setIsActive(!isActive);
  };

  const checkAnswer = () => {
    if (!session || !userInput.trim()) return;

    setIsLoadingFeedback(true);
    
    // Get Bible version info
    const bibleVersion = getVersionById(userStats.preferredVersion, availableBibleVersions);
    const versionName = bibleVersion?.name || 'King James Version';
    
    // First get verse comparison
    VerseComparisonService.compareVerses(userInput, session.verse.text, versionName)
      .then((comparison) => {
        setComparisonResult(comparison);
        
        // Update session with actual accuracy and award points
        const updatedSessionWithAccuracy = {
          ...session,
          attempts: session.attempts + 1,
          accuracy: comparison.accuracy,
          completed: comparison.accuracy >= 70
        };
        setSession(updatedSessionWithAccuracy);
        
        // Save to Supabase history with user input and comparison result
        HistoryService.saveMemorizationResult(
          updatedSessionWithAccuracy, 
          comparison.accuracy, 
          practiceTime,
          userInput.trim(), // User's actual typed text
          comparison // Detailed comparison result
        ).catch(error => console.error('Failed to save to history:', error));
        
        // Award points based on actual accuracy
        const points = Math.round(comparison.accuracy * 1.5);
        onComplete(points);
        
        // Then get AI feedback with the accurate comparison data
        return AIService.getPersonalizedFeedback(userInput, session.verse.text, comparison.accuracy, userStats)
          .then((aiResponse) => ({ aiResponse, accuracy: comparison.accuracy }));
      })
      .then(({ aiResponse, accuracy }) => {
        setResult({ 
          accuracy: accuracy, 
          feedback: aiResponse.feedback,
          analysis: aiResponse.analysis,
          strategies: aiResponse.strategies,
          spiritualInsight: aiResponse.spiritualInsight,
          nextSteps: aiResponse.nextSteps,
          encouragement: aiResponse.encouragement
        });
        setIsLoadingFeedback(false);
        setPhase('feedback');
      })
      .catch(() => {
        // Fallback if everything fails
        const accuracy = 50; // Fallback accuracy
        const feedback = "Keep practicing to improve your accuracy!";
        const suggestions = ["Try breaking the verse into smaller chunks", "Practice reading aloud"];
        
        // Save to Supabase history even with fallback
        const fallbackSession = {
          ...session,
          attempts: session.attempts + 1,
          accuracy,
          completed: accuracy >= 70
        };
        HistoryService.saveMemorizationResult(
          fallbackSession, 
          accuracy, 
          practiceTime,
          userInput.trim(), // User's actual typed text even in fallback
          null // No detailed comparison in fallback
        ).catch(error => console.error('Failed to save fallback to history:', error));
        
        setResult({ 
          accuracy, 
          feedback, 
          analysis: "Keep practicing to improve your accuracy!",
          strategies: suggestions,
          spiritualInsight: "Focus on understanding the verse's meaning.",
          nextSteps: "Try practicing again tomorrow.",
          encouragement: "You're making progress!"
        });
        setIsLoadingFeedback(false);
        setPhase('feedback');
      });
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('bibleMemoryHistoryUpdated'));
    
  };

  const retry = () => {
    setPhase('study');
    setTimeLeft(studyTime);
    setIsActive(false);
    setUserInput('');
    setResult(null);
    setComparisonResult(null);
    setSelectedWord(null);
    setIsLoadingFeedback(false);
    setPracticeTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderInteractiveComparison = (words: any[], type: 'user' | 'original') => {
    return words.map((wordData, index) => {
      const { userWord, originalWord, status, suggestion } = wordData;
      const displayWord = type === 'user' ? userWord : originalWord;
      
      if (!displayWord) return null;
      
      let className = 'px-2 py-1 rounded cursor-pointer transition-all hover:scale-105 mr-1 mb-1 inline-block ';
      
      switch (status) {
        case 'correct':
          className += 'bg-green-200 text-green-800 hover:bg-green-300';
          break;
        case 'incorrect':
          className += 'bg-red-200 text-red-800 hover:bg-red-300';
          break;
        case 'missing':
          className += 'bg-red-200 text-red-800 hover:bg-red-300';
          break;
        case 'extra':
          className += 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300';
          break;
        default:
          className += 'bg-gray-200 text-gray-800';
      }
      
      return (
        <span
          key={index}
          className={className}
          onClick={() => suggestion && setSelectedWord({ word: displayWord, suggestion })}
          title={suggestion || 'Click for details'}
        >
          {displayWord}
          {status === 'extra' && type === 'user' && ' (+)'}
          {status === 'missing' && type === 'original' && ' (missing)'}
        </span>
      );
    });
  };
  if (!selectedVerse) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Verse Selected</h3>
        <p className="text-gray-500 mb-6">Choose a verse from the Generator tab to start memorizing</p>
        <button
          onClick={onBackToGenerator}
          className="button-primary"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-4">
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200">
        {/* Study Phase */}
        {phase === 'study' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Study Your Verse</h2>
              <p className="text-sm sm:text-base text-gray-600">Memorize this verse before the timer runs out</p>
            </div>

            <CountdownTimer 
              timeLeft={timeLeft} 
              totalTime={studyTime} 
              isActive={isActive} 
            />

            {/* Verse Display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6">
              <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 italic text-center">
                "{displayVerse?.text || selectedVerse?.text}"
              </p>
              {displayVerse?.isTranslated && (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mb-2 text-center">
                  🌍 Auto-translated to {displayVerse.translationLanguage?.toUpperCase()}
                </div>
              )}
              <p className="text-sm sm:text-base text-purple-600 font-medium text-center">
                {selectedVerse?.reference}
              </p>
            </div>

            <div className="text-center space-x-2 sm:space-x-4">
              {!isActive && timeLeft === studyTime ? (
                <button onClick={startStudy} className="button-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  Start Study Session
                </button>
              ) : (
                <button
                  onClick={togglePause}
                  className="button-secondary flex items-center space-x-1 sm:space-x-2 mx-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  {isActive ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                  <span>{isActive ? 'Pause' : 'Resume'}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Input Phase */}
        {phase === 'input' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Recite from Memory</h2>
              <p className="text-sm sm:text-base text-gray-600">Type the verse as accurately as you can remember</p>
              <p className="text-sm sm:text-base text-purple-600 font-medium mt-2">{selectedVerse.reference}</p>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-purple-100 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-purple-700">
                  {formatTime(practiceTime)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the verse from memory..."
                className="w-full p-3 sm:p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-lg"
                rows={3}
                autoFocus
              />
              
              <div className="text-center">
                <button
                  onClick={checkAnswer}
                  disabled={!userInput.trim()}
                  className="button-primary disabled:opacity-50 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  Check My Answer
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading Phase */}
        {isLoadingFeedback && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Analyzing Your Heart's Work</h2>
              <p className="text-sm sm:text-base text-gray-600">Our AI is prayerfully reviewing your memorization with God's wisdom</p>
            </div>

            {/* Animated Loading Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <div className="absolute inset-0 border-6 sm:border-8 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-6 sm:border-8 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-4xl animate-pulse">📖</span>
                </div>
              </div>
            </div>

            {/* Encouraging Message */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-8 text-center border-2 border-purple-200">
              <div className="animate-fade-in">
                <p className="text-base sm:text-xl font-medium text-gray-800 mb-4">
                  {loadingMessage}
                </p>
                <div className="flex justify-center space-x-1 sm:space-x-2 mb-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 italic">
                  "Thy word have I hid in mine heart, that I might not sin against thee." - Psalm 119:11
                </p>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="mt-6 sm:mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Calculating accuracy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span>Generating personalized feedback</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span>Preparing spiritual insights</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && result && !isLoadingFeedback && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Your Results</h2>
              <p className="text-sm sm:text-base text-gray-600">Here's how you did with your memorization</p>
            </div>

            {/* Accuracy Score */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-3xl font-bold mb-4 animate-celebration ${
                result.accuracy >= 90 ? 'bg-green-100 text-green-600' :
                result.accuracy >= 70 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {result.accuracy}%
              </div>
              <p className={`text-base sm:text-lg font-semibold ${
                result.accuracy >= 90 ? 'text-green-600' :
                result.accuracy >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {result.feedback}
              </p>
            </div>

            {/* Improvement Suggestions */}
            <div className="space-y-4 sm:space-y-6">
              {/* Interactive Verse Comparison */}
              {comparisonResult && (
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden text-sm sm:text-base">
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="flex items-center">
                        <span className="mr-2">📝</span>
                        Interactive Verse Comparison
                      </span>
                      <span className="text-xs sm:text-sm font-normal text-gray-600">
                        {getVersionById(userStats.preferredVersion, availableBibleVersions)?.name || 'KJV'}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* User's Version */}
                    <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-red-700 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        Your Version ({comparisonResult.correctWords}/{comparisonResult.totalWords} correct)
                      </h4>
                      <div className="text-xs sm:text-sm leading-relaxed">
                        {renderInteractiveComparison(comparisonResult.userComparison, 'user')}
                      </div>
                    </div>
                    
                    {/* Original Version */}
                    <div className="p-4 sm:p-6">
                      <h4 className="text-xs sm:text-sm font-semibold text-green-700 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Original Verse
                      </h4>
                      <div className="text-xs sm:text-sm leading-relaxed">
                        {renderInteractiveComparison(comparisonResult.originalComparison, 'original')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-center">
                      <div>
                        <div className="text-base sm:text-lg font-bold text-green-600">{comparisonResult.correctWords}</div>
                        <div className="text-xs text-gray-600">Correct</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-bold text-red-600">{comparisonResult.incorrectWords}</div>
                        <div className="text-xs text-gray-600">Incorrect</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-bold text-red-600">{comparisonResult.missingWords}</div>
                        <div className="text-xs text-gray-600">Missing</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-bold text-yellow-600">{comparisonResult.extraWords}</div>
                        <div className="text-xs text-gray-600">Extra</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-green-200 rounded"></span>
                        <span>Correct</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-red-200 rounded"></span>
                        <span>Incorrect/Missing</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-yellow-200 rounded"></span>
                        <span>Extra Words</span>
                      </div>
                      <div className="text-purple-600 font-medium text-center w-full sm:w-auto">
                        💡 Click any word for details
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Word Detail Modal */}
              {selectedWord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 mx-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Word Analysis</h3>
                      <div className="text-xl sm:text-2xl font-bold text-purple-600 bg-purple-100 rounded-lg py-2 px-4 inline-block">
                        "{selectedWord.word}"
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-sm sm:text-base text-gray-700">{selectedWord.suggestion}</p>
                    </div>
                    <button
                      onClick={() => setSelectedWord(null)}
                      className="w-full button-primary text-sm sm:text-base py-2 sm:py-3"
                    >
                      Got it!
                    </button>
                  </div>
                </div>
              )}

              {/* Detailed Feedback from API */}
              {comparisonResult && (
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden text-sm sm:text-base">
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📝</span>
                      Detailed Analysis
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <pre className="whitespace-pre-wrap text-gray-700 text-xs sm:text-sm">
                      {comparisonResult.detailedFeedback}
                    </pre>
                  </div>
                </div>
              )}

              {/* Analysis */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🔍</span>
                  Analysis
                </h3>
                <p className="text-sm sm:text-base text-gray-700">{result.analysis}</p>
              </div>

              {/* Memorization Strategies */}
              {result.strategies.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-600" />
                    Memorization Strategies
                  </h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {result.strategies.map((strategy, index) => (
                      <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Spiritual Insight */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">✨</span>
                  Spiritual Insight
                </h3>
                <p className="text-sm sm:text-base text-gray-700 italic">{result.spiritualInsight}</p>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🎯</span>
                  Next Steps
                </h3>
                <p className="text-sm sm:text-base text-gray-700">{result.nextSteps}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Syntax Lab Button - only show if there are wrong words */}
                {comparisonResult && (comparisonResult.incorrectWords > 0 || comparisonResult.missingWords > 0 || comparisonResult.extraWords > 0) && (
                  <button
                    onClick={() => {
                      onComparisonComplete(comparisonResult);
                      setActiveTab('syntax-lab');
                    }}
                    className="button-primary flex items-center space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Go to Syntax Lab</span>
                  </button>
                )}
                
                <button
                  onClick={retry}
                  className="button-secondary flex items-center space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={onBackToGenerator}
                  className="button-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                >
                  New Verse
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemorizePage;