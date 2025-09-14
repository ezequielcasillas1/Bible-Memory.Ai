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
  const [forceRenderKey, setForceRenderKey] = useState<number>(0); // FORCE RENDER MECHANISM
  const [localWordsFixed, setLocalWordsFixed] = useState<string[]>([]); // LOCAL STATE BACKUP

  // Update blank word and formatted text when session changes
  useEffect(() => {
    if (!currentSession) return;

    // UNIFIED: Use factory-generated fillInBlankResult if available, otherwise create fresh
    let fillInBlankState;
    let fillInBlankResult;

    if (currentSession.fillInBlankResult) {
      // Use factory-generated result with dynamic progression
      const failedWords = currentSession.wrongWords.map((w: any) => (w.originalWord || w.userWord) as string);
      const uniqueFailedWords: string[] = Array.from(new Set(
        failedWords.map((w: string) => w.toLowerCase().replace(/[.,!?;:"']/g, ''))
      ));

      fillInBlankState = {
        verse: currentSession.verse.text,
        failedWords: uniqueFailedWords,
        completedWords: wordsFixed,
        currentBlankIndex: wordsFixed.length, // Dynamic progression
        translationContext: translatedSessionVerse?.isTranslated ? {
          isTranslated: true,
          originalVerse: currentSession.verse.text,
          translatedVerse: translatedSessionVerse.text
        } : undefined
      };

      // Generate fresh blanks with current progression state
      fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);
    } else {
      // Fallback for legacy sessions without factory-generated results
      const failedWords = currentSession.wrongWords.map((w: any) => (w.originalWord || w.userWord) as string);
      
      fillInBlankState = {
        verse: currentSession.verse.text,
        failedWords: failedWords,
        completedWords: wordsFixed,
        currentBlankIndex: wordsFixed.length,
        translationContext: translatedSessionVerse?.isTranslated ? {
          isTranslated: true,
          originalVerse: currentSession.verse.text,
          translatedVerse: translatedSessionVerse.text
        } : undefined
      };

      fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);
    }

    const currentBlank = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    setCurrentBlankWord(currentBlank);
    setFormattedText(fillInBlankResult.formattedText);

    console.log('🎯 FILL-IN-BLANK UI UPDATE:', {
      sessionId: currentSession.id,
      currentRound: currentRound,
      hasFactoryResult: !!currentSession.fillInBlankResult,
      currentBlank,
      wordsFixed: wordsFixed, // FIXED: Log actual array, not just length
      wordsFixedLength: wordsFixed.length,
      totalBlanks: fillInBlankResult.blanks.filter(b => b.isBlank).length,
      failedWordsCount: fillInBlankState.failedWords.length,
      failedWords: fillInBlankState.failedWords
    });
    
    // FORCE RENDER: Trigger visual re-render when wordsFixed changes
    setForceRenderKey(prev => prev + 1);
    
    // LOCAL STATE SYNC: Ensure local state matches parent state
    if (JSON.stringify(localWordsFixed) !== JSON.stringify(wordsFixed)) {
      console.log('🔄 LOCAL STATE SYNC:', { 
        from: localWordsFixed, 
        to: wordsFixed,
        syncTimestamp: new Date().toISOString()
      });
      setLocalWordsFixed([...wordsFixed]); // Force new array reference
    }
  }, [currentSession, wordsFixed, translatedSessionVerse, currentRound, localWordsFixed]);

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

  // NEW: Automatic word advancement - check for correct word on each keystroke
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
    };
  }, [autoAdvanceTimeout]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setUserInput(newValue);
    
    // Clear any existing auto-advance timeout
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
    
    // FEATURE: Auto-advance when word is complete and correct
    if (newValue.trim() && currentBlankWord && !isSubmitting) {
      const cleanUserInput = newValue.trim().toLowerCase().replace(/[.,!?;:"']/g, '');
      const cleanExpectedWord = currentBlankWord.toLowerCase().replace(/[.,!?;:"']/g, '');
      
      // Check if typed word matches expected word exactly
      if (cleanUserInput === cleanExpectedWord) {
        console.log('🚀 AUTO-ADVANCE: Correct word detected, advancing automatically!', {
          userInput: newValue,
          expectedWord: currentBlankWord,
          cleanUserInput,
          cleanExpectedWord
        });
        
        // Set timeout for smooth UX with visual feedback
        const timeout = setTimeout(() => {
          if (!isSubmitting) {
            setIsSubmitting(true);
            handleWordSubmit();
            // Reset submitting state after a short delay
            setTimeout(() => setIsSubmitting(false), 100);
          }
        }, 500); // 500ms delay for better visual feedback
        
        setAutoAdvanceTimeout(timeout);
      }
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
      {/* Enhanced Progress Display - GUIDE.md Compliant */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-3xl p-8 border-2 border-violet-200 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                Fill-in-the-Blank Practice
              </h3>
              <p className="text-sm text-violet-600 font-medium">Master your verse with targeted practice</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-violet-700">
              Round {currentRound} of {currentSession?.maxRounds || 3}
            </div>
            <div className="text-sm text-violet-600 font-medium">
              Word {progressData.round.currentWord} of {progressData.round.total}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <div className="w-full bg-gradient-to-r from-violet-200 to-purple-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 h-4 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ 
                  width: `${progressData.round.percentage}%`,
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-violet-600 mt-2 font-medium">
              <span>Start</span>
              <span>{progressData.round.percentage}% Complete</span>
              <span>Mastery</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {progressData.round.percentage}%
            </div>
            <div className="text-xs text-violet-500 font-medium">Progress</div>
          </div>
        </div>
      </div>

      {/* Enhanced Verse Display - GUIDE.md Professional Styling */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl p-10 border-2 border-slate-200 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-slate-100 to-blue-100 rounded-2xl px-6 py-3 border border-slate-200 shadow-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">📖</span>
            </div>
            <h4 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
              {currentSession.verse.reference}
            </h4>
          </div>
          <p className="text-sm text-slate-600 mt-3 font-medium">Fill in each highlighted blank to complete the verse</p>
        </div>
        
        <div 
          key={`verse-display-${wordsFixed.length}-${currentRound}-${forceRenderKey}`}
          className="text-lg leading-relaxed text-gray-700 text-center mb-4"
        >
          {(() => {
            if (!currentSession?.verse?.text) return null;
            
            const words = currentSession.verse.text.split(' ');
            
            // CRITICAL FIX: Use Set to get unique failed words only
            const uniqueFailedWords = new Set(
              currentSession.wrongWords.map((w: any) => 
                (w.originalWord || w.userWord).toLowerCase().replace(/[.,!?;:"']/g, '')
              )
            );
            
            // CRITICAL FIX: Use localWordsFixed instead of potentially stale wordsFixed prop
            const effectiveWordsFixed = localWordsFixed.length >= wordsFixed.length ? localWordsFixed : wordsFixed;
            const uniqueCompletedWords = new Set(
              effectiveWordsFixed.map((wf: string) => wf.toLowerCase().replace(/[.,!?;:"']/g, ''))
            );
            
            // ENHANCED DEBUG: Log visual render state
            console.log('🎨 VISUAL RENDER:', {
              wordsFixed,
              localWordsFixed,
              effectiveWordsFixed,
              uniqueFailedWords: Array.from(uniqueFailedWords),
              uniqueCompletedWords: Array.from(uniqueCompletedWords),
              renderTimestamp: new Date().toISOString(),
              forceRenderKey
            });
            
            // CRITICAL DEBUG: Check each failed word individually
            currentSession.wrongWords.forEach((w: any) => {
              const originalWord = w.originalWord || w.userWord;
              const cleanOriginal = originalWord.toLowerCase().replace(/[.,!?;:"']/g, '');
              const isInCompleted = uniqueCompletedWords.has(cleanOriginal);
              console.log(`🔍 WORD CHECK: "${originalWord}" -> clean:"${cleanOriginal}" -> completed:${isInCompleted}`);
            });
            
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
                  console.log(`✅ RENDERING COMPLETED WORD: "${word}" at index ${index}`);
                  return (
                    <span 
                      key={`completed-${cleanWord}-${index}-${wordsFixed.length}`} 
                      className="inline-block mx-1 px-3 py-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-white rounded-lg font-bold shadow-lg border-2 border-green-300 animate-pulse"
                      style={{
                        animation: 'greenSuccess 0.6s ease-out'
                      }}
                    >
                      {word}
                    </span>
                  );
                } else if (isCurrentBlank) {
                  // ENHANCED: Currently active blank with REAL-TIME LETTER-BY-LETTER TYPING
                  console.log(`🎯 RENDERING CURRENT BLANK: "${word}" at index ${index}`);
                  
                  // FEATURE: Show user's typing in real-time, letter by letter
                  const displayText = userInput.trim() || '_____';
                  const isTyping = userInput.trim().length > 0;
                  
                  return (
                    <span 
                      key={`current-${cleanWord}-${index}-${wordsFixed.length}`} 
                      className={`inline-block mx-2 px-6 py-3 rounded-2xl font-bold shadow-2xl border-2 transform scale-110 backdrop-blur-sm transition-all duration-300 ${
                        isTyping 
                          ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white border-white/30 animate-pulse'
                          : 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white border-white/30 animate-pulse'
                      }`}
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: '#fbbf24',
                        textDecorationThickness: '3px',
                        animation: isTyping ? 'none' : 'purpleActive 1.5s ease-in-out infinite alternate',
                        boxShadow: isTyping 
                          ? '0 0 40px rgba(59, 130, 246, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                          : '0 0 30px rgba(139, 92, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <span className="text-xl font-mono tracking-widest">
                        {displayText}
                        {isTyping && <span className="animate-pulse">|</span>}
                      </span>
                    </span>
                  );
                } else {
                  // ENHANCED: Waiting blanks - Professional gradient styling
                  console.log(`⏳ RENDERING WAITING BLANK: "${word}" at index ${index}`);
                  return (
                    <span 
                      key={`waiting-${cleanWord}-${index}-${wordsFixed.length}`} 
                      className="inline-block mx-2 px-4 py-2 bg-gradient-to-br from-amber-200 via-yellow-200 to-orange-200 text-amber-800 rounded-xl font-bold border-2 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: '#f59e0b',
                        textDecorationThickness: '2px',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <span className="text-lg font-mono tracking-wide">_____</span>
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

      {/* Enhanced Input Section - GUIDE.md Professional Design */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl p-10 shadow-2xl border-2 border-slate-200 backdrop-blur-sm">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl px-6 py-4 border border-emerald-200 shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">✏️</span>
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Fill in the missing word
                </h4>
                <p className="text-sm text-emerald-600 font-medium">Type the correct word to continue</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-2xl px-6 py-4 border border-blue-200 shadow-inner">
              <p className="text-sm font-medium flex items-center justify-center space-x-2">
                <span className="text-2xl">📍</span>
                <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">
                  PROGRESSIVE SEQUENCE
                </span>
                <span className="text-blue-600">- Complete each blank from left to right</span>
              </p>
            </div>
            
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
              onChange={handleInputChange}
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
              <span className="text-sm opacity-75">(Auto-advances ✨ or Enter ↵)</span>
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
