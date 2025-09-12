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

    const fillInBlankState = {
      verse: currentSession.verse.text,
      failedWords: currentSession.wrongWords.map((w: any) => w.originalWord || w.userWord),
      completedWords: wordsFixed,
      currentBlankIndex: 0,
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
          {formattedText.split(' ').map((word, index) => {
            if (word === '____') {
              return (
                <span 
                  key={index} 
                  className="inline-block mx-1 px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-lg font-bold shadow-lg animate-pulse"
                >
                  ____
                </span>
              );
            }
            return (
              <span key={index} className="mx-1 text-gray-700 transition-all duration-300 hover:text-emerald-600">
                {word}
              </span>
            );
          })}
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
              placeholder="Type the missing word..."
              className="w-full px-6 py-4 text-lg border-2 border-emerald-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 text-center font-medium bg-gradient-to-r from-white to-emerald-50"
              autoFocus
            />
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
  );
};

export default FillInBlankPractice;
