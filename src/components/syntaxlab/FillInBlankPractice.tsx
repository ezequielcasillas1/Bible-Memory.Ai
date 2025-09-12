import React, { useState, useEffect } from 'react';
import { Target, Lightbulb, Eye, Trophy } from 'lucide-react';
import { PracticePhaseProps } from './types';
import { FillInBlankAPI } from '../../services/fillInBlankService';

const FillInBlankPractice: React.FC<PracticePhaseProps> = ({
  currentSession,
  translatedSessionVerse,
  currentRound,
  wordsFixed,
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
  handleWordSubmit,
  getProgressData,
  t
}) => {
  const [currentBlankWord, setCurrentBlankWord] = useState<string | null>(null);
  const [formattedText, setFormattedText] = useState<string>('');

  // Update blank word and formatted text when session changes
  useEffect(() => {
    if (!currentSession?.fillInBlankResult) return;

    // FIXED: Calculate dynamic currentBlankIndex based on completed words
    // This ensures progression to the next blank after each correct answer
    const failedWords = currentSession.wrongWords.map((w: any) => w.originalWord || w.userWord);
    const dynamicBlankIndex = wordsFixed.length; // Number of completed words = current blank position
    
    const fillInBlankState = {
      verse: currentSession.verse.text,
      failedWords: failedWords,
      completedWords: wordsFixed,
      currentBlankIndex: dynamicBlankIndex, // FIXED: Dynamic instead of hardcoded 0
      translationContext: translatedSessionVerse?.isTranslated ? {
        isTranslated: true,
        originalVerse: currentSession.verse.text,
        translatedVerse: translatedSessionVerse.text
      } : undefined
    };

    const currentBlank = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    setCurrentBlankWord(currentBlank);

    const result = FillInBlankAPI.generateBlanks(fillInBlankState);
    setFormattedText(result.formattedText);
  }, [currentSession, wordsFixed, translatedSessionVerse]);

  const generateHint = async (word: string): Promise<string> => {
    // Simple hint generation - could be enhanced with AI
    const hints = [
      `This word starts with "${word.charAt(0).toUpperCase()}"`,
      `This word has ${word.length} letters`,
      `Think about the context of the verse`,
      `This word is important to the meaning`
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  };

  const handleHintClick = async () => {
    if (showHint) {
      setShowHint(false);
      setCurrentHint('');
    } else {
      setIsLoadingHint(true);
      setShowHint(true);
      try {
        const wordForHint = currentBlankWord;
        const hint = await generateHint(wordForHint || '');
        setCurrentHint(hint);
      } catch (error) {
        console.error('Hint generation failed:', error);
        setCurrentHint('Try thinking about the verse context');
      } finally {
        setIsLoadingHint(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWordSubmit();
    }
  };

  if (!currentSession) {
    return <div>No session available</div>;
  }

  const progressData = getProgressData();

  return (
    <>
      {/* CSS Animations for Visual States */}
      <style>{`
        @keyframes greenSuccess {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        
        @keyframes purpleActive {
          0% { 
            transform: scale(1.1); 
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
            filter: brightness(1);
          }
          100% { 
            transform: scale(1.15); 
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.8);
            filter: brightness(1.1);
          }
        }
        
        @keyframes correctWordFlash {
          0% { background: linear-gradient(45deg, #10b981, #059669); }
          50% { background: linear-gradient(45deg, #34d399, #10b981); }
          100% { background: linear-gradient(45deg, #10b981, #059669); }
        }
      `}</style>
      
      <div className="space-y-6">
      {/* Progress Display */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-emerald-800">🎯 Fill-in-the-Blank Practice</h3>
          <div className="text-sm text-emerald-600 font-medium">
            Round {currentRound} • Word {progressData.round.currentWord}/{progressData.round.total}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressData.round.percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm font-bold text-emerald-700">
            {progressData.round.percentage}%
          </div>
        </div>
      </div>

      {/* Verse Display with Blanks */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            {currentSession.verse.reference}
          </h4>
        </div>
        
        <div className="text-lg leading-relaxed text-gray-700 text-center mb-4">
          {(() => {
            if (!currentSession?.verse?.text) return null;
            
            const words = currentSession.verse.text.split(' ');
            
            // CRITICAL FIX: Use Set to get unique failed words only
            const uniqueFailedWords = new Set(
              currentSession.wrongWords.map((w: any) => 
                (w.originalWord || w.userWord).toLowerCase().replace(/[.,!?;:"']/g, '')
              )
            );
            
            const uniqueCompletedWords = new Set(
              wordsFixed.map((wf: string) => wf.toLowerCase().replace(/[.,!?;:"']/g, ''))
            );
            
            // Track which unique words have been processed to prevent duplicates
            const processedUniqueWords = new Set<string>();
            
            return words.map((word: string, index: number) => {
              const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
              
              // FIXED: Only show blank for FIRST occurrence of each unique failed word
              const isUniqueFailedWord = uniqueFailedWords.has(cleanWord);
              const hasBeenProcessed = processedUniqueWords.has(cleanWord);
              const shouldShowBlank = isUniqueFailedWord && !hasBeenProcessed;
              
              if (shouldShowBlank) {
                processedUniqueWords.add(cleanWord); // Mark as processed
              }
              
              const isCompleted = uniqueCompletedWords.has(cleanWord);
              const isCurrentBlank = cleanWord === currentBlankWord?.toLowerCase().replace(/[.,!?;:"']/g, '');
              
              if (shouldShowBlank) {
                if (isCompleted) {
                  // GREEN HIGHLIGHT: Completed words
                  return (
                    <span 
                      key={index} 
                      className="inline-block mx-1 px-3 py-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-white rounded-lg font-bold shadow-lg border-2 border-green-300 animate-pulse"
                      style={{
                        animation: 'greenSuccess 0.6s ease-out'
                      }}
                    >
                      {word}
                    </span>
                  );
                } else if (isCurrentBlank) {
                  // PURPLE GRADIENT: Currently active blank while typing
                  return (
                    <span 
                      key={index} 
                      className="inline-block mx-1 px-4 py-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white rounded-xl font-bold shadow-xl border-2 border-purple-300 animate-pulse transform scale-110"
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: '#fbbf24',
                        textDecorationThickness: '3px',
                        animation: 'purpleActive 1.5s ease-in-out infinite alternate'
                      }}
                    >
                      ____
                    </span>
                  );
                } else {
                  // UNDERLINE: All other active blanks waiting
                  return (
                    <span 
                      key={index} 
                      className="inline-block mx-1 px-3 py-1 bg-gradient-to-r from-yellow-200 to-orange-200 text-gray-800 rounded-lg font-bold border-2 border-yellow-400 shadow-md"
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: '#f59e0b',
                        textDecorationThickness: '2px'
                      }}
                    >
                      ____
                    </span>
                  );
                }
              }
              
              // Regular words
              return (
                <span key={index} className="mx-1 text-gray-700 transition-all duration-300 hover:text-emerald-600">
                  {word}
                </span>
              );
            });
          })()}
        </div>

        {translatedSessionVerse?.isTranslated && (
          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-2 text-center">
            🌍 Auto-translated to {translatedSessionVerse.translationLanguage?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-emerald-200">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-800">
              Fill in the missing word:
            </h4>
            <p className="text-sm text-gray-600 font-medium">
              📍 <span className="text-emerald-700">STARTING FROM LEFT TO RIGHT</span> - Fill in each highlighted blank in sequence
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleHintClick}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                <span>{showHint ? 'Hide Hint' : 'Get Hint'}</span>
              </button>
              
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
              >
                <Eye className="w-4 h-4" />
                <span>{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
              </button>
            </div>
            
            {showHint && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                <strong>Hint:</strong> {isLoadingHint ? 'Generating smart hint...' : currentHint}
              </div>
            )}
            
            {showAnswer && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                <strong>Answer:</strong> <span className="font-bold text-orange-800">
                  {currentBlankWord || 'No blank found'}
                </span>
              </div>
            )}
          </div>
          
          {/* Input field */}
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type "${currentBlankWord}" here...`}
              className={`w-full px-6 py-4 text-lg border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 text-center font-medium ${
                userInput.trim() 
                  ? 'border-purple-400 focus:ring-purple-200 focus:border-purple-600 bg-gradient-to-r from-purple-50 to-violet-50' 
                  : 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-500 bg-gradient-to-r from-white to-emerald-50'
              }`}
              style={{
                boxShadow: userInput.trim() ? '0 0 20px rgba(147, 51, 234, 0.3)' : '0 0 10px rgba(16, 185, 129, 0.2)'
              }}
              autoFocus
            />
            {userInput.trim() && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
            )}
          </div>
          
          <button
            onClick={handleWordSubmit}
            disabled={!userInput.trim()}
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <Target className="w-5 h-5 group-hover:animate-spin" />
              <span>Check Word</span>
              <span className="text-sm opacity-75">(Enter ↵)</span>
            </span>
          </button>
          
          {/* Proceed to Results button when 100% complete */}
          {progressData.global.percentage >= 100 && (
            <button
              onClick={() => {
                // This will be handled by the parent component
                console.log('Session completed!');
              }}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 group-hover:animate-bounce" />
                <span>Proceed to Results</span>
                <span className="text-sm opacity-75">✨</span>
              </span>
            </button>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default FillInBlankPractice;
