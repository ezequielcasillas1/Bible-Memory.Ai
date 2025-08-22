import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { ArrowLeft, Target, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { GrammarValidationAPI, type GrammarValidation } from '../services/grammarValidationAPI';
import { FillInBlankService, type FillInBlankResult } from '../services/fillInBlankService';
import { OriginalVerseService } from '../services/originalVerseService';
import { SyntaxLabAPI } from '../services/syntaxLabAPI';
=======
import { ArrowLeft, Play, RotateCcw, Target, Zap, Clock, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5

interface SyntaxLabPageProps {
  comparisonResult: ComparisonResult | null;
  onBack: () => void;
  onStartNewSession: () => void;
}

type PracticeMode = 'blank' | 'type-along';
type SessionPhase = 'summary' | 'practice' | 'flashcards' | 'challenge' | 'scorecard';

const SyntaxLabPage: React.FC<SyntaxLabPageProps> = ({ comparisonResult, onBack, onStartNewSession }) => {
<<<<<<< HEAD
  const { } = useLanguage();
=======
  const { t } = useLanguage();
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
  const [phase, setPhase] = useState<SessionPhase>('summary');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('blank');
  const [currentSession, setCurrentSession] = useState<SyntaxLabSession | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordsFixed, setWordsFixed] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
<<<<<<< HEAD
=======
  const [showFlashcard, setShowFlashcard] = useState(false);
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
  const [flashcardSide, setFlashcardSide] = useState<'front' | 'back'>('front');
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(30);
  const [challengeActive, setChallengeActive] = useState(false);
  const [stats, setStats] = useState<SyntaxLabStats | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
<<<<<<< HEAD
  
  // Fill-in-the-blank state
  const [fillInBlankResult, setFillInBlankResult] = useState<FillInBlankResult | null>(null);
  const [filledWords, setFilledWords] = useState<{ [key: number]: string }>({});
  const [originalVerseText, setOriginalVerseText] = useState<string>('');
  
  // Challenge state  
  const [challengeWordsToType, setChallengeWordsToType] = useState<string[]>([]);
  const [challengeVerseDisplay, setChallengeVerseDisplay] = useState<string>('');
  const [currentChallengeWordIndex, setCurrentChallengeWordIndex] = useState(0);
  const [grammarFeedback, setGrammarFeedback] = useState<GrammarValidation | null>(null);
  
  // Scramble & Place state
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [droppedWords, setDroppedWords] = useState<{ [key: number]: string }>({});
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Type-along state for real-time validation
  const [typeAlongWords, setTypeAlongWords] = useState<string[]>([]);
  const [userWords, setUserWords] = useState<string[]>([]);
  const [currentTypingWordIndex, setCurrentTypingWordIndex] = useState(0);
=======
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5

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
<<<<<<< HEAD
      // Extract original verse text
      const cleanOriginalText = OriginalVerseService.getCleanOriginalVerse(comparisonResult);
      setOriginalVerseText(cleanOriginalText);
      
=======
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
      const wrongWords = [
        ...comparisonResult.userComparison.filter(w => w.status === 'incorrect' || w.status === 'extra'),
        ...comparisonResult.originalComparison.filter(w => w.status === 'missing')
      ];

<<<<<<< HEAD
      setCurrentSession({
        id: `session-${Date.now()}`,
        startTime: new Date(),
        verseId: `verse-${Date.now()}`,
        verse: {
          id: `verse-${Date.now()}`,
          text: cleanOriginalText, // Use clean original text
          reference: 'Romans 8:1',
=======
      const session: SyntaxLabSession = {
        id: `session-${Date.now()}`,
        verseId: `verse-${Date.now()}`,
        verse: {
          id: `verse-${Date.now()}`,
          text: comparisonResult.userComparison.map(w => w.originalWord || w.userWord).join(' '),
          reference: 'Current Verse',
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
          testament: 'NT'
        },
        originalComparison: comparisonResult,
        wrongWords,
        practiceMode: 'blank',
        currentRound: 1,
        maxRounds: 3,
        wordsFixed: [],
<<<<<<< HEAD
        improvementScore: 0,
        finalAccuracy: 0
      });
    }
  }, [comparisonResult, currentSession]);

=======
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

>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
  const checkWord = (input: string, targetWord: string): boolean => {
    return input.toLowerCase().trim() === targetWord.toLowerCase().trim();
  };

<<<<<<< HEAD
  // Real-time type-along validation
  const handleTypeAlongInput = (inputText: string) => {
    setUserInput(inputText);
    
    // Split user input into words
    const inputWords = inputText.trim().split(/\s+/).filter(word => word.length > 0);
    setUserWords(inputWords);
    
    // Update current typing word index
    const lastWordIndex = Math.max(0, inputWords.length - 1);
    setCurrentTypingWordIndex(lastWordIndex);
    
    // Check if user has completed typing
    if (inputWords.length >= typeAlongWords.length) {
      // Check final accuracy
      const correctWords = inputWords.filter((word, index) => 
        index < typeAlongWords.length && 
        word.toLowerCase().replace(/[.,!?;:"']/g, '') === 
        typeAlongWords[index].toLowerCase().replace(/[.,!?;:"']/g, '')
      );
      
      if (correctWords.length === typeAlongWords.length) {
        // All correct - move to next round or complete
        setTimeout(() => {
          const newWordsFixed = [...wordsFixed];
          currentSession?.wrongWords.forEach(wrongWord => {
            if (!newWordsFixed.includes(wrongWord.originalWord)) {
              newWordsFixed.push(wrongWord.originalWord);
            }
          });
          setWordsFixed(newWordsFixed);
          
          if (currentRound < (currentSession?.maxRounds || 3)) {
            setCurrentRound(currentRound + 1);
            setUserInput('');
            setUserWords([]);
            setCurrentTypingWordIndex(0);
          } else {
            setPhase('flashcards');
          }
        }, 1000);
      }
    }
  };

  // Get word validation status for type-along
  const getWordStatus = (wordIndex: number, userWord: string, targetWord: string): 'correct' | 'incorrect' | 'partial' | 'pending' => {
    if (wordIndex >= userWords.length) return 'pending';
    
    const cleanUser = userWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    const cleanTarget = targetWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    if (wordIndex < userWords.length - 1) {
      // Completed word
      return cleanUser === cleanTarget ? 'correct' : 'incorrect';
    } else {
      // Currently typing word
      if (cleanUser === cleanTarget) return 'correct';
      if (cleanTarget.startsWith(cleanUser) && cleanUser.length > 0) return 'partial';
      return cleanUser.length > 0 ? 'incorrect' : 'pending';
    }
  };

  const handleWordSubmit = async () => {
    if (!currentSession) return;

    // Handle challenge mode differently
    if (phase === 'challenge' && challengeWordsToType.length > 0) {
      const currentTargetWord = challengeWordsToType[currentChallengeWordIndex];
      
      // Use grammar API for enhanced validation
      const grammarValidation = GrammarValidationAPI.validateGrammar(
        userInput, 
        currentTargetWord, 
        currentSession.verse.text
      );
      
      setGrammarFeedback(grammarValidation);
      
      if (grammarValidation.isCorrect) {
        const newWordsFixed = [...wordsFixed, currentTargetWord];
        setWordsFixed(newWordsFixed);
        
        // Move to next word in challenge
        if (currentChallengeWordIndex < challengeWordsToType.length - 1) {
          setCurrentChallengeWordIndex(currentChallengeWordIndex + 1);
          setUserInput('');
          setGrammarFeedback(null);
        } else {
          // Challenge complete
          setChallengeActive(false);
          setPhase('scorecard');
          completeSession();
        }
      } else {
        // Show feedback for 2 seconds, then clear input
        setTimeout(() => {
          setUserInput('');
          setGrammarFeedback(null);
        }, 2000);
      }
      return;
    }

    // Regular practice mode
    if (practiceMode === 'blank' && fillInBlankResult) {
      // Find current blank to fill
      const blankWords = fillInBlankResult.blanks.filter(b => b.isBlank);
      if (currentWordIndex >= blankWords.length) {
        // All blanks completed - move to next round or flashcards
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
        if (currentRound < currentSession.maxRounds) {
          setCurrentRound(currentRound + 1);
          setCurrentWordIndex(0);
          setUserInput('');
<<<<<<< HEAD
          setFilledWords({});
        } else {
          setPhase('flashcards');
        }
        return;
      }
      
      const currentBlank = blankWords[currentWordIndex];
      const isCorrect = FillInBlankService.checkBlankAnswer(userInput, currentBlank.word);
      
      if (isCorrect) {
        // Fill in the blank
        const newFilledWords = { ...filledWords, [currentBlank.position]: userInput };
        setFilledWords(newFilledWords);
        
        const newWordsFixed = [...wordsFixed, currentBlank.word];
        setWordsFixed(newWordsFixed);
        
        // Find matching wrong word and update
        const matchingWrongWord = currentSession.wrongWords.find(w => 
          w.originalWord.toLowerCase().replace(/[.,!?;:"']/g, '') === 
          currentBlank.word.toLowerCase().replace(/[.,!?;:"']/g, '')
        );
        if (matchingWrongWord) {
          updateWeakWords(matchingWrongWord, true);
        }
        
        // Move to next blank
        if (currentWordIndex < blankWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setUserInput('');
        } else {
          // All blanks in this round completed
          if (currentRound < currentSession.maxRounds) {
            setCurrentRound(currentRound + 1);
            setCurrentWordIndex(0);
            setUserInput('');
            setFilledWords({});
          } else {
            setPhase('flashcards');
          }
        }
      } else {
        // Wrong answer - provide feedback but don't advance
        handleEnhancedValidation(userInput, currentBlank.word);
        const matchingWrongWord = currentSession.wrongWords.find(w => 
          w.originalWord.toLowerCase().replace(/[.,!?;:"']/g, '') === 
          currentBlank.word.toLowerCase().replace(/[.,!?;:"']/g, '')
        );
        if (matchingWrongWord) {
          updateWeakWords(matchingWrongWord, false);
        }
      }
    } else {
      // Type-along mode or fallback
      const currentWord = currentSession.wrongWords[currentWordIndex];
      const isCorrect = checkWord(userInput, currentWord.originalWord);
      
      if (isCorrect) {
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
        updateWeakWords(currentWord, false);
      }
    }
  };

  const handleEnhancedValidation = async (userInput: string, targetWord: string) => {
    const grammarValidation = GrammarValidationAPI.validateGrammar(userInput, targetWord, currentSession?.verse.text || '');
    const contextualHints = GrammarValidationAPI.getContextualHints([targetWord], currentSession?.verse.text || '');
    
    // Show feedback (you could display this in UI)
    console.log('Grammar feedback:', grammarValidation);
    console.log('Contextual hints:', contextualHints);
  };

=======
        } else {
          setPhase('flashcards');
        }
      }
    } else {
      // Update weak words for incorrect attempt
      updateWeakWords(currentWord, false);
    }
  };

>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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

<<<<<<< HEAD
  const startPractice = (mode: PracticeMode) => {
    setPracticeMode(mode);
    setPhase('practice');
    setCurrentWordIndex(0);
    setUserInput('');
    
    if (mode === 'blank' && currentSession && originalVerseText) {
      // For blank mode, calculate fill-in-blanks using original verse
      const wordsToFix = currentSession.wrongWords.map(w => w.originalWord);
      const fillInBlankData = FillInBlankService.calculateFillInBlanks(originalVerseText, wordsToFix);
      setFillInBlankResult(fillInBlankData);
      setFilledWords({});
    } else if (mode === 'type-along' && currentSession && originalVerseText) {
      // For type-along mode, prepare word array for real-time validation
      const words = originalVerseText.split(' ');
      setTypeAlongWords(words);
      setUserWords([]);
      setCurrentTypingWordIndex(0);
    }
  };

  const startChallenge = () => {
    if (!currentSession) return;
    
    // Prepare challenge data
    const validWrongWords = currentSession.wrongWords.filter(word => 
      word && word.originalWord && word.originalWord.trim().length > 0
    );
    
    const wordsToType = validWrongWords.map(w => w.originalWord);
    setChallengeWordsToType(wordsToType);
    
    // Create verse display with half the text covered
    const verseWords = currentSession.verse.text.split(' ');
    const halfPoint = Math.floor(verseWords.length / 2);
    const displayWords = verseWords.map((word, index) => {
      if (index >= halfPoint) {
        // Second half - cover all words that need to be typed
        const isWordToType = wordsToType.some(targetWord => 
          word.toLowerCase().replace(/[.,!?;:"']/g, '') === targetWord.toLowerCase()
        );
        return isWordToType ? '_______' : word;
      }
      return word; // First half - show as is
    });
    
    setChallengeVerseDisplay(displayWords.join(' '));
    setCurrentChallengeWordIndex(0);
=======
  const startChallenge = () => {
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
    setPhase('challenge');
    setChallengeTimeLeft(30);
    setChallengeActive(true);
    setCurrentWordIndex(0);
    setUserInput('');
<<<<<<< HEAD
    setGrammarFeedback(null);
=======
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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

<<<<<<< HEAD
  // Drag and Drop handlers for Scramble & Place
  const handleDragStart = (e: React.DragEvent, word: string) => {
    setDraggedWord(word);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedWord) {
      setDroppedWords(prev => ({ ...prev, [index]: draggedWord }));
      setDraggedWord(null);
      setDragOverIndex(null);
    }
  };

  const handleRemoveDroppedWord = (index: number) => {
    setDroppedWords(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

=======
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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
<<<<<<< HEAD
            onClick={() => {
              if (phase === 'practice' || phase === 'flashcards' || phase === 'challenge') {
                setPhase('summary'); // Go back to training menu instead of memorization
              } else {
                onBack(); // Only go back to memorization from summary
              }
            }}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{phase === 'summary' ? 'Back to Memorization' : 'Back to Training Menu'}</span>
=======
            onClick={onBack}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Memorization</span>
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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
<<<<<<< HEAD
                <div className="text-2xl font-bold text-green-600">{comparisonResult?.correctWords || 0}</div>
=======
                <div className="text-2xl font-bold text-green-600">{comparisonResult.correctWords}</div>
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
                <div className="text-sm text-green-700">Correct Words</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
<<<<<<< HEAD
                <div className="text-2xl font-bold text-red-600">{comparisonResult?.incorrectWords || 0}</div>
=======
                <div className="text-2xl font-bold text-red-600">{comparisonResult.incorrectWords}</div>
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
                <div className="text-sm text-red-700">Wrong Words</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
<<<<<<< HEAD
                <div className="text-2xl font-bold text-yellow-600">{comparisonResult?.extraWords || 0}</div>
=======
                <div className="text-2xl font-bold text-yellow-600">{comparisonResult.extraWords}</div>
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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
<<<<<<< HEAD
                
                <button
                  onClick={() => startPractice('type-along')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
=======
                <button
                  onClick={() => startPractice('type-along')}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Brain className="w-4 h-4" />
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
                  <span>Type-Along Mode</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Practice */}
        {phase === 'practice' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
<<<<<<< HEAD
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {practiceMode === 'blank' ? 'Fill in the Blanks' : 'Type Along'}
              </h2>
              <div className="text-sm text-gray-600">
                Round {currentRound}/{currentSession.maxRounds} • Word {currentWordIndex + 1}/{
                  practiceMode === 'blank' && fillInBlankResult 
                    ? fillInBlankResult.blanks.filter(b => b.isBlank).length
                    : currentSession.wrongWords.length
                }
              </div>
            </div>

            {/* Progress Bar */}
=======
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {practiceMode === 'blank' ? 'Fill in the Blanks' : 'Type Along'}
              </h2>
              <div className="text-sm text-gray-600">
                Round {currentRound}/{currentSession.maxRounds} • Word {currentWordIndex + 1}/{currentSession.wrongWords.length}
              </div>
            </div>

>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
<<<<<<< HEAD
                  style={{ 
                    width: `${
                      practiceMode === 'blank' && fillInBlankResult 
                        ? ((currentWordIndex + 1) / fillInBlankResult.blanks.filter(b => b.isBlank).length) * 100
                        : ((currentWordIndex + 1) / currentSession.wrongWords.length) * 100
                    }%` 
                  }}
=======
                  style={{ width: `${((currentWordIndex + 1) / currentSession.wrongWords.length) * 100}%` }}
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
                ></div>
              </div>
            </div>

<<<<<<< HEAD
            {practiceMode === 'blank' && fillInBlankResult && (
              <div className="space-y-6">
                {/* Fill-in-the-blank display */}
                <div className="fill-blank-container">
                  {fillInBlankResult.blanks.map((blankWord, index) => (
                    <span key={index}>
                      {blankWord.isBlank ? (
                        <span className={`${
                          filledWords[blankWord.position] 
                            ? 'fill-blank-filled' 
                            : 'fill-blank-underscore'
                        }`}>
                          {filledWords[blankWord.position] || blankWord.underscores}
                        </span>
                      ) : (
                        <span className="fill-blank-normal">{blankWord.word}</span>
                      )}
                      {index < fillInBlankResult.blanks.length - 1 && ' '}
                    </span>
                  ))}
                </div>

                {/* Current word indicator */}
                {(() => {
                  const blankWords = fillInBlankResult.blanks.filter(b => b.isBlank);
                  const currentBlank = blankWords[currentWordIndex];
                  
                  return currentBlank ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="text-center">
                        <p className="text-sm text-blue-600 mb-2">
                          Word {currentWordIndex + 1} of {blankWords.length} • Round {currentRound}
                        </p>
                        <p className="text-lg font-semibold text-blue-800">
                          Fill in: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                            {currentBlank.underscores}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5

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

<<<<<<< HEAD
            {practiceMode === 'type-along' && typeAlongWords.length > 0 && (
              <div className="space-y-6">
                {/* Real-time word validation display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-center text-blue-800 mb-4">
                    ✨ Type Along - Real-time Validation
                  </h3>
                  <div className="flex flex-wrap gap-1 justify-center items-center leading-relaxed text-lg">
                    {typeAlongWords.map((targetWord, index) => {
                      const userWord = userWords[index] || '';
                      const status = getWordStatus(index, userWord, targetWord);
                      
                      return (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded transition-all duration-200 ${
                            status === 'correct' 
                              ? 'bg-green-200 text-green-800 font-semibold' 
                              : status === 'incorrect'
                              ? 'bg-red-200 text-red-800 font-semibold'
                              : status === 'partial'
                              ? 'bg-yellow-200 text-yellow-800 font-semibold'
                              : index === currentTypingWordIndex && userInput.trim().length > 0
                              ? 'bg-blue-200 text-blue-800 border-2 border-blue-400'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {status === 'pending' ? targetWord : userWord || targetWord}
                        </span>
                      );
                    })}
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(userWords.filter((word, index) => 
                            getWordStatus(index, word, typeAlongWords[index]) === 'correct'
                          ).length / typeAlongWords.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {userWords.filter((word, index) => 
                        getWordStatus(index, word, typeAlongWords[index]) === 'correct'
                      ).length} / {typeAlongWords.length} words correct
                    </p>
                  </div>
                </div>

                {/* Enhanced typing area */}
                <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
                  <div className="mb-4 text-center">
                    <h4 className="text-lg font-semibold text-purple-800 mb-2">
                      Type the verse below:
                    </h4>
                    <p className="text-sm text-purple-600">
                      Watch the words above change color as you type! 
                      <span className="inline-block mx-2 px-2 py-1 bg-green-200 text-green-800 rounded text-xs">Green = Correct</span>
                      <span className="inline-block mx-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">Yellow = Partial</span>
                      <span className="inline-block mx-2 px-2 py-1 bg-red-200 text-red-800 rounded text-xs">Red = Wrong</span>
                    </p>
                  </div>
                  
                  <textarea
                    value={userInput}
                    onChange={(e) => handleTypeAlongInput(e.target.value)}
                    placeholder="Start typing the verse here... You'll see real-time feedback above!"
                    className="w-full p-4 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-lg leading-relaxed"
                    rows={4}
                    autoFocus
                  />
                  
                  {/* Current word hint */}
                  {currentTypingWordIndex < typeAlongWords.length && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-center text-blue-700">
                        <span className="font-semibold">Next word to type:</span> 
                        <span className="ml-2 px-2 py-1 bg-blue-200 rounded font-mono">
                          {typeAlongWords[currentTypingWordIndex]}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Accuracy feedback */}
                {userWords.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {userWords.filter((word, index) => 
                          getWordStatus(index, word, typeAlongWords[index]) === 'correct'
                        ).length}
                      </div>
                      <div className="text-sm text-green-700">Correct</div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userWords.filter((word, index) => 
                          getWordStatus(index, word, typeAlongWords[index]) === 'partial'
                        ).length}
                      </div>
                      <div className="text-sm text-yellow-700">Partial</div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                      <div className="text-2xl font-bold text-red-600">
                        {userWords.filter((word, index) => 
                          getWordStatus(index, word, typeAlongWords[index]) === 'incorrect'
                        ).length}
                      </div>
                      <div className="text-sm text-red-700">Incorrect</div>
                    </div>
                  </div>
                )}
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
              </div>
            )}
          </div>
        )}

        {/* Phase: Flashcards */}
        {phase === 'flashcards' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Quick Review Cards</h2>
            
<<<<<<< HEAD
            {(() => {
              // Filter out invalid/empty words
              const validWords = currentSession.wrongWords.filter(word => 
                word && word.originalWord && word.originalWord.trim().length > 0
              );
              
              if (validWords.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-gray-600 mb-4">No words to review!</div>
                    <button
                      onClick={() => setPhase('challenge')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Skip to Challenge
                    </button>
                  </div>
                );
              }
              
              // Ensure currentWordIndex is within bounds
              const safeIndex = Math.min(currentWordIndex, validWords.length - 1);
              const currentWord = validWords[safeIndex];
              
              return (
                <div className="max-w-md mx-auto">
                  <div className="mb-4 text-center">
                    <span className="text-sm text-gray-600">
                      Card {safeIndex + 1} of {validWords.length}
                    </span>
                  </div>
                  
                  <div 
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all min-h-48 flex items-center justify-center"
                    onClick={() => setFlashcardSide(flashcardSide === 'front' ? 'back' : 'front')}
                  >
                    {flashcardSide === 'front' ? (
                      <div className="text-center">
                        <p className="text-2xl font-mono mb-4">
                          {renderWordWithMask(currentWord.originalWord, 2)}
                        </p>
                        <p className="text-sm text-gray-600">Click to reveal</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 mb-2">
                          {currentWord.originalWord}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentWord.suggestion || `Definition: A key word from ${currentSession.verse.reference}`}
                        </p>
                      </div>
                    )}
                  </div>
              
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => {
                        setCurrentWordIndex(Math.max(0, safeIndex - 1));
                        setFlashcardSide('front');
                      }}
                      disabled={safeIndex === 0}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {safeIndex < validWords.length - 1 ? (
                      <button
                        onClick={() => {
                          setCurrentWordIndex(safeIndex + 1);
                          setFlashcardSide('front');
                        }}
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
              );
            })()}
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
          </div>
        )}

        {/* Phase: Challenge */}
        {phase === 'challenge' && currentSession && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <div className="text-center mb-6">
<<<<<<< HEAD
              <h2 className="text-xl font-bold text-gray-800 mb-2">⚡ Enhanced Timed Challenge</h2>
              <div className="text-3xl font-bold text-red-600 mb-2">{challengeTimeLeft}s</div>
              <p className="text-gray-600">Type the missing words from the second half!</p>
            </div>

            <div className="space-y-6">
              {/* Verse Display with Half Text */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">Verse Text:</h3>
                <p className="text-lg leading-relaxed text-center">
                  {challengeVerseDisplay.split(' ').map((word, index) => (
                    <span 
                      key={index}
                      className={word === '_______' ? 'bg-yellow-200 px-2 py-1 rounded mx-1 font-mono text-purple-600' : 'mx-1'}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              </div>

              {/* Current Word to Type */}
              {challengeWordsToType.length > 0 && currentChallengeWordIndex < challengeWordsToType.length && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 mb-2">Word {currentChallengeWordIndex + 1} of {challengeWordsToType.length}</p>
                    <p className="text-lg font-semibold text-blue-800">
                      Type: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                        {renderWordWithMask(challengeWordsToType[currentChallengeWordIndex], 3)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              
              {/* Input Field */}
=======
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
              
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
              <div className="text-center">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
<<<<<<< HEAD
                  placeholder="Type the missing word..."
=======
                  placeholder="Quick! Type the word..."
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
                  className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg"
                  autoFocus
                  disabled={!challengeActive}
                />
              </div>
<<<<<<< HEAD

              {/* Grammar Feedback */}
              {grammarFeedback && (
                <div className={`rounded-xl p-4 border-2 ${
                  grammarFeedback.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                } animate-fade-in`}>
                  <div className="text-center">
                    <p className={`text-lg font-semibold mb-2 ${
                      grammarFeedback.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {grammarFeedback.isCorrect ? '✅ Correct!' : '❌ Not quite right'}
                    </p>
                    {!grammarFeedback.isCorrect && (
                      <>
                        <p className="text-sm text-gray-600 mb-2">{grammarFeedback.contextualHint}</p>
                        {grammarFeedback.suggestions.length > 0 && (
                          <p className="text-sm text-blue-600">
                            Suggestion: <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                              {grammarFeedback.suggestions[0]}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Scramble & Place Challenge */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 text-center">
                  🎲 Scramble & Place Challenge
                </h3>
                
                {/* Scrambled Words to Drag */}
                <div className="mb-6">
                  <p className="text-sm text-purple-600 mb-3 text-center">Drag these words into the correct positions:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SyntaxLabAPI.generateScrambledWords(currentSession.wrongWords.map(w => w.originalWord)).map((word, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, word)}
                        className={`draggable-word ${draggedWord === word ? 'dragging' : ''}`}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drop Zones in Verse */}
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
                  <p className="text-sm text-purple-600 mb-3 text-center">Drop words here:</p>
                  <div className="flex flex-wrap gap-1 justify-center items-center">
                    {currentSession.verse.text.split(' ').map((word, index) => {
                      const isTargetWord = currentSession.wrongWords.some(w => 
                        w.originalWord.toLowerCase() === word.toLowerCase().replace(/[.,!?;:"']/g, '')
                      );
                      
                      if (isTargetWord) {
                        return (
                          <div
                            key={index}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`drop-zone ${
                              droppedWords[index] ? 'filled' : 'empty'
                            } ${dragOverIndex === index ? 'drag-over' : ''}`}
                            onClick={() => droppedWords[index] && handleRemoveDroppedWord(index)}
                          >
                            {droppedWords[index] || '___'}
                          </div>
                        );
                      } else {
                        return (
                          <span key={index} className="mx-1 text-gray-700">
                            {word}
                          </span>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
=======
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
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

<<<<<<< HEAD
            {/* Encouragement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-800">Progress</h4>
                </div>
                <p className="text-purple-700 text-sm">
                  Most missed type: {stats.mostMissedTypes[0]}
                </p>
                <p className="text-purple-700 text-sm">
                  Accuracy trend: {stats.accuracyTrend.length > 1 ? '↑ Improving' : 'Getting started'}
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                  <h4 className="font-semibold text-yellow-800">Encouragement</h4>
                </div>
                <p className="text-yellow-700 text-sm">
                  You mastered {wordsFixed.length} challenging words today—keep it up! 
                  {wordsFixed.length >= currentSession.wrongWords.length * 0.8 && " You're becoming a Scripture master!"}
                </p>
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
              </div>
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={onStartNewSession}
<<<<<<< HEAD
                className="button-primary mr-4"
              >
                Practice New Verse
              </button>
              <button
                onClick={onBack}
                className="button-secondary"
              >
                Back to Memorization
=======
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
>>>>>>> 5bb1a74f66f0bccd13dbbaaa1c8f827dbc6747b5
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyntaxLabPage;