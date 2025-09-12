import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Target, Zap, Clock, Trophy, BookOpen, Brain, CheckCircle, X, Lightbulb, TrendingUp, History, Calendar, BarChart3, Bot, ChevronRight, BarChart, SkipForward } from 'lucide-react';
import { SyntaxLabSession, WeakWord, SyntaxLabStats, ComparisonResult, WordComparison, MemorizationHistory, Verse, AppSettings } from '../types';
import { useAutoTranslatedVerse } from '../hooks/useAutoTranslatedVerse';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryService } from '../services/historyService';
import { OriginalVerseService } from '../services/originalVerseService';
import { SyntaxLabAPI, type SyntaxLabSessionData } from '../services/syntaxLabAPI';
import { FillInBlankService, FillInBlankAPI } from '../services/fillInBlankService';
import { RoundProgressionAPI, RoundProgressionState } from '../services/roundProgressionAPI';

interface SyntaxLabPageProps {
  comparisonResult: ComparisonResult | null;
  selectedVerse: Verse | null;
  onBack: () => void;
  onStartNewSession: () => void;
  settings: AppSettings; // Add settings prop
}

type PracticeMode = 'blank' | 'type-along';
type SessionPhase = 'summary' | 'practice' | 'flashcards' | 'challenge' | 'scorecard' | 'completion';

const SyntaxLabPage: React.FC<SyntaxLabPageProps> = ({ comparisonResult, selectedVerse, onBack, onStartNewSession, settings }) => {
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
      const verseData = selectedVerse || {
        id: `verse-${Date.now()}`,
        text: sessionData.verseText,
        reference: sessionData.verseReference,
        testament: "NT" as const
      };

      // CRITICAL FIX: Use translated text for the session verse if available
      const verseTextForSession = translatedVerseText || sessionData.verseText;
      
      const session: SyntaxLabSession = {
        id: sessionData.id,
        startTime: sessionData.createdAt,
        verseId: verseData.id,
        verse: {
          id: verseData.id,
          text: verseTextForSession, // Use translated text if available
          reference: verseData.reference,
          testament: verseData.testament
        },
        originalComparison: comparisonResult,
        wrongWords, // Use the WordComparison[] format
        practiceMode: 'blank',
        currentRound: 1,
        maxRounds: settings?.maxRounds || 3,
        wordsFixed: [],
        finalAccuracy: 0,
        improvementScore: 0,
        fillInBlankResult: undefined // Will be set with round-based logic
      };

      // Set session first so getWordsForCurrentRound() works
      setCurrentSession(session);
      
      // Calculate round 1 words using improved distribution algorithm
      const allWrongWords = wrongWords.map(w => w.originalWord || w.userWord);
      const maxRounds = settings?.maxRounds || 3;
      const totalWords = allWrongWords.length;
      const baseWordsPerRound = Math.floor(totalWords / maxRounds);
      const extraWords = totalWords % maxRounds;
      
      // Round 1 gets base words + 1 if there are extra words
      const round1WordCount = baseWordsPerRound + (1 <= extraWords ? 1 : 0);
      const round1Words = allWrongWords.slice(0, round1WordCount);
      
      // CRITICAL FIX: Use translated verse text for fill-in-blank creation if available
      console.log('🔧 FILL-IN-BLANK CREATION DEBUG:', {
        isTranslated: !!translatedVerseText,
        englishText: sessionData.verseText,
        translatedText: translatedVerseText,
        verseTextForSession: verseTextForSession,
        round1Words: round1Words,
        wrongWords: wrongWords
      });
      
      // NUMERICAL DIFFICULTY-BASED FILL-IN-BLANK CREATION
      // Use numerical difficulty system instead of memorization-based approach
      const difficultyLevel = settings?.fillInBlankDifficulty || 6;
      const difficultyWords = FillInBlankService.selectWordsForNumericalDifficulty(
        verseTextForSession, 
        difficultyLevel
      );
      
      console.log('🎯 NUMERICAL DIFFICULTY DEBUG:', {
        difficultyLevel,
        verseText: verseTextForSession,
        selectedWords: difficultyWords,
        expectedBlanks: difficultyLevel
      });
      
      // Create fill-in-blank result using numerical difficulty words
      const fillInBlankResult = translatedVerseText 
        ? FillInBlankService.calculateProgressiveFillInBlanks(
            verseTextForSession, // Spanish text
            difficultyWords, // Use numerical difficulty words instead of round1Words
            [], // No words fixed yet
            {
              englishText: sessionData.verseText, // English text
              englishWrongWords: difficultyWords // English wrong words
            }
          )
        : FillInBlankService.calculateProgressiveFillInBlanks(
            verseTextForSession, // English text
            difficultyWords, // Use numerical difficulty words
            [] // No words fixed yet
          );
      
      // Update session with proper fill-in-blank data
      const finalSession = {
        ...session,
        fillInBlankResult: fillInBlankResult
      };
      
      setCurrentSession(finalSession);
    }
  }, [comparisonResult, selectedVerse, currentSession]);

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
      maxRounds: settings?.maxRounds || 3,
      wordsFixed: [],
      improvementScore: 0,
      finalAccuracy: 0,
      fillInBlankResult: undefined // Will be set after session creation
    };

    // Set session first so getWordsForCurrentRound() works
    setCurrentSession(newSession);
    
    // Calculate round 1 words using improved distribution algorithm  
    const maxRounds = settings?.maxRounds || 3;
    const totalWords = selectedWords.length;
    const baseWordsPerRound = Math.floor(totalWords / maxRounds);
    const extraWords = totalWords % maxRounds;
    
    // Round 1 gets base words + 1 if there are extra words
    const round1WordCount = baseWordsPerRound + (1 <= extraWords ? 1 : 0);
    const round1Words = selectedWords.slice(0, round1WordCount);
    
    const fillInBlankResult = FillInBlankService.calculateProgressiveFillInBlanks(
      historyEntry.verse.text,
      round1Words,
      [] // No words fixed yet
    );
    
    // Update session with proper fill-in-blank data
    const finalSession = {
      ...newSession,
      fillInBlankResult: fillInBlankResult
    };
    
    setCurrentSession(finalSession);
    setPhase('summary');
    setShowHistoryLog(false);
  };

  // Restart regular practice session with fill-in-blank mode
  const restartRegularPractice = () => {
    if (currentSession) {
      // Reset session state for fresh practice
      setCurrentRound(1);
      setWordsFixed([]);
      setCurrentWordIndex(0);
      setUserInput('');
      setShowHint(false);
      setShowAnswer(false);
      setPracticeMode('blank');
      setPhase('practice');
    }
  };

  // Create an auto-generated practice session with random verses
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
      },
      {
        id: 'romans-8-28',
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        reference: 'Romans 8:28',
        testament: 'NT'
      },
      {
        id: 'philippians-4-13',
        text: 'I can do all this through him who gives me strength.',
        reference: 'Philippians 4:13',
        testament: 'NT'
      },
      {
        id: 'jeremiah-29-11',
        text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you hope and a future.',
        reference: 'Jeremiah 29:11',
        testament: 'OT'
      }
    ];

    // Randomly select a verse
    const randomVerse = sampleVerses[Math.floor(Math.random() * sampleVerses.length)];
    
    // Create a mock comparison result for auto practice
    const mockComparisonResult: ComparisonResult = {
      accuracy: 0, // Start with 0% to practice everything
      totalWords: randomVerse.text.split(' ').length,
      correctWords: 0,
      incorrectWords: randomVerse.text.split(' ').length,
      missingWords: 0,
      extraWords: 0,
      userComparison: [],
      originalComparison: [],
      detailedFeedback: `Auto-generated practice session for ${randomVerse.reference}`
    };

    // Use numerical difficulty-based word selection
    const selectedWords = FillInBlankService.selectWordsForNumericalDifficulty(
      randomVerse.text, 
      settings?.fillInBlankDifficulty || 6
    );
    
    const practiceWords: WordComparison[] = selectedWords.map((word: string, i: number) => ({
      userWord: '', // User hasn't typed anything yet
      originalWord: word.replace(/[.,!?;:"']/g, ''), // Clean punctuation
      status: 'incorrect' as const,
      position: i,
      suggestion: word.replace(/[.,!?;:"']/g, '')
    }));

    const newSession: SyntaxLabSession = {
      id: `auto-session-${Date.now()}`,
      startTime: new Date(),
      verseId: randomVerse.id,
      verse: randomVerse,
      originalComparison: mockComparisonResult,
      wrongWords: practiceWords,
      practiceMode: 'blank',
      currentRound: 1,
      maxRounds: settings?.maxRounds || 3,
      wordsFixed: [],
      improvementScore: 0,
      finalAccuracy: 0,
      fillInBlankResult: undefined // Will be set after session creation
    };

    // Set session first so getWordsForCurrentRound() works
    setCurrentSession(newSession);
    
    // Calculate round 1 words using improved distribution algorithm
    const maxRounds = settings?.maxRounds || 3;
    const totalWords = selectedWords.length;
    const baseWordsPerRound = Math.floor(totalWords / maxRounds);
    const extraWords = totalWords % maxRounds;
    
    // Round 1 gets base words + 1 if there are extra words
    const round1WordCount = baseWordsPerRound + (1 <= extraWords ? 1 : 0);
    const round1Words = selectedWords.slice(0, round1WordCount);
    
    // For round-based cycling, use regular fill-in-blanks with round 1 words only
    const fillInBlankResult = FillInBlankService.calculateFillInBlanks(
      randomVerse.text,
      round1Words // Use round 1 words for initial display
    );
    
    // Update session with proper fill-in-blank data
    const finalSession = {
      ...newSession,
      fillInBlankResult: fillInBlankResult
    };

    // Reset state for fresh session
    setCurrentRound(1);
    setWordsFixed([]);
    setCurrentWordIndex(0);
    setUserInput('');
    setShowHint(false);
    setShowAnswer(false);
    
    setCurrentSession(finalSession);
    setPhase('summary');
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

  // Type-Along Mode Functions
  const initializeTypeAlongSession = () => {
    // Predefined verses for Type-Along sessions
    const typeAlongVersesList: Verse[] = [
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
      },
      {
        id: 'romans-8-28',
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        reference: 'Romans 8:28',
        testament: 'NT'
      },
      {
        id: 'philippians-4-13',
        text: 'I can do all this through him who gives me strength.',
        reference: 'Philippians 4:13',
        testament: 'NT'
      },
      {
        id: 'jeremiah-29-11',
        text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you hope and a future.',
        reference: 'Jeremiah 29:11',
        testament: 'OT'
      }
    ];
    
    setTypeAlongVerses(typeAlongVersesList);
    setCurrentVerseIndex(0);
    setVerseCompletionData([]);
    setHasCompletedFirstVerse(false);
    setShowTypeAlongResults(false);
    setVerseStartTime(new Date());

    // CRITICAL FIX: Create currentSession for type-along mode
    // Use the first verse (John 3:16) to initialize the session
    const firstVerse = typeAlongVersesList[0];
    createTypeAlongSession(firstVerse);
  };

  // NEW: Create a proper session for type-along mode
  const createTypeAlongSession = (verse: Verse) => {
    // Convert all verse words to WordComparison format for type-along
    const verseWords = verse.text.split(' ');
    const wrongWords: WordComparison[] = verseWords.map((word, index) => ({
      userWord: '', // User hasn't typed anything yet
      originalWord: word,
      status: 'incorrect' as const, // All words start as incorrect in type-along mode
      position: index,
      suggestion: word // The word they should type
    }));

    // Create mock comparison result for type-along
    const mockComparison: ComparisonResult = {
      accuracy: 0, // Start at 0% for type-along
      totalWords: verseWords.length,
      correctWords: 0,
      incorrectWords: verseWords.length, // All words are "incorrect" initially
      missingWords: 0,
      extraWords: 0,
      userComparison: wrongWords,
      originalComparison: wrongWords,
      detailedFeedback: `Type-along practice for ${verse.reference}`
    };

    // Create the session using existing logic but adapted for type-along
    const session: SyntaxLabSession = {
      id: `type-along-${Date.now()}`,
      verseId: verse.id,
      verse: verse,
      originalComparison: mockComparison,
      wrongWords: wrongWords, // All words are practice targets
      practiceMode: 'type-along',
      currentRound: 1,
      maxRounds: 3, // Default to 3 rounds
      wordsFixed: [],
      startTime: new Date(),
      finalAccuracy: 0,
      improvementScore: 0
    };

    // Initialize fill-in-blank for type-along (progressive mode)
    const fillInBlankResult = FillInBlankService.calculateProgressiveFillInBlanks(
      verse.text,
      wrongWords.map(ww => ww.originalWord),
      [] // No words completed yet
    );

    const finalSession = {
      ...session,
      fillInBlankResult: fillInBlankResult
    };

    // Reset state for fresh session
    setCurrentRound(1);
    setWordsFixed([]);
    setCurrentWordIndex(0);
    setUserInput('');
    setShowHint(false);
    setShowAnswer(false);
    
    setCurrentSession(finalSession);
    setPhase('practice');
  };

  const getCurrentTypeAlongVerse = (): Verse | null => {
    if (typeAlongVerses.length === 0 || currentVerseIndex >= typeAlongVerses.length) {
      return null;
    }
    return typeAlongVerses[currentVerseIndex];
  };

  const calculateVerseAccuracy = (userText: string, targetText: string): number => {
    if (!userText || !targetText) return 0;
    
    const userWords = userText.toLowerCase().trim().split(/\s+/);
    const targetWords = targetText.toLowerCase().trim().split(/\s+/);
    
    let correctWords = 0;
    const maxLength = Math.max(userWords.length, targetWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (userWords[i] && targetWords[i] && userWords[i] === targetWords[i]) {
        correctWords++;
      }
    }
    
    return targetWords.length > 0 ? Math.round((correctWords / targetWords.length) * 100) : 0;
  };

  const handleVerseCompletion = (accuracy: number) => {
    const currentVerse = getCurrentTypeAlongVerse();
    if (!currentVerse || !verseStartTime) return;
    
    const timeSpent = Math.round((new Date().getTime() - verseStartTime.getTime()) / 1000);
    
    const completionData = {
      verse: currentVerse,
      accuracy,
      timeSpent,
      completedAt: new Date()
    };
    
    setVerseCompletionData(prev => [...prev, completionData]);
    setHasCompletedFirstVerse(true);
    
    // Show success animation
    showFloatingEmoji('🎉', true);
  };

  const moveToNextVerse = () => {
    if (currentVerseIndex < typeAlongVerses.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
      setUserInput('');
      setVerseStartTime(new Date());
      
      // CRITICAL FIX: Create new session for the next verse
      const nextVerseIndex = currentVerseIndex + 1;
      const nextVerse = typeAlongVerses[nextVerseIndex];
      if (nextVerse) {
        createTypeAlongSession(nextVerse);
      }
    }
  };

  const skipCurrentVerse = () => {
    const currentVerse = getCurrentTypeAlongVerse();
    if (!currentVerse || !verseStartTime) return;
    
    const timeSpent = Math.round((new Date().getTime() - verseStartTime.getTime()) / 1000);
    
    const completionData = {
      verse: currentVerse,
      accuracy: 0, // Skipped verses get 0% accuracy
      timeSpent,
      completedAt: new Date()
    };
    
    setVerseCompletionData(prev => [...prev, completionData]);
    moveToNextVerse();
  };

  // Helper function to convert SyntaxLabSession to SyntaxLabSessionData
  const convertToSessionData = (session: SyntaxLabSession): SyntaxLabSessionData => {
    // Create mock ComparisonResult from session data for API compatibility
    const mockComparison: ComparisonResult = {
      accuracy: session.finalAccuracy || 0,
      totalWords: session.wrongWords.length,
      correctWords: 0,
      incorrectWords: session.wrongWords.length,
      missingWords: 0,
      extraWords: 0,
      userComparison: session.wrongWords.map(w => ({
        userWord: '',
        originalWord: w.originalWord,
        status: 'incorrect' as const,
        position: 0
      })),
      originalComparison: session.wrongWords.map(w => ({
        userWord: '',
        originalWord: w.originalWord,
        status: 'incorrect' as const,
        position: 0
      })),
      detailedFeedback: 'Converted from SyntaxLabSession'
    };
    
    // Generate proper fillInBlankState using the new API
    const fillInBlankState = FillInBlankAPI.createFillInBlankState(session.verse.text, mockComparison);
    // Set completed words to match current session state
    fillInBlankState.completedWords = session.wordsFixed || [];
    
    // CRITICAL: Add translation context for Spanish/other language support
    const translatedSessionVerse = displayVerse;
    if (translatedSessionVerse?.isTranslated && translatedSessionVerse.text) {
      fillInBlankState.translationContext = {
        isTranslated: true,
        originalVerse: session.verse.text, // English verse
        translatedVerse: translatedSessionVerse.text // Spanish verse
      };
    }
    
    return {
      id: session.id,
      verseText: session.verse.text,
      verseReference: session.verse.reference,
      wrongWords: session.wrongWords.map(w => w.originalWord),
      fillInBlankResult: session.fillInBlankResult,
      fillInBlankState, // FIXED: Properly initialize state
      originalVerseText: session.verse.text,
      createdAt: session.startTime
    };
  };

  // Helper function to convert SyntaxLabSessionData back to SyntaxLabSession
  const convertFromSessionData = (sessionData: SyntaxLabSessionData, originalSession: SyntaxLabSession): SyntaxLabSession => {
    return {
      ...originalSession,
      fillInBlankResult: sessionData.fillInBlankResult
    };
  };

  // NEW API: Get current blank word using SyntaxLabAPI
  const getCurrentBlankWord = (): string | null => {
    if (!currentSession) return null;
    const sessionData = convertToSessionData(currentSession);
    return SyntaxLabAPI.getCurrentBlankWord(sessionData);
  };

  // Helper function to get round-specific word distribution
  const getWordsForCurrentRound = () => {
    if (!currentSession) return [];
    
    const allWrongWords = currentSession.wrongWords.map(ww => ww.originalWord);
    const maxRounds = currentSession.maxRounds || 3;
    
    // More even distribution algorithm
    const totalWords = allWrongWords.length;
    const baseWordsPerRound = Math.floor(totalWords / maxRounds);
    const extraWords = totalWords % maxRounds;
    
    // Calculate start index for current round
    let startIndex = 0;
    for (let round = 1; round < currentRound; round++) {
      const wordsInThisRound = baseWordsPerRound + (round <= extraWords ? 1 : 0);
      startIndex += wordsInThisRound;
    }
    
    // Calculate words for current round
    const wordsInCurrentRound = baseWordsPerRound + (currentRound <= extraWords ? 1 : 0);
    const endIndex = startIndex + wordsInCurrentRound;
    
    const roundWords = allWrongWords.slice(startIndex, endIndex);
    
    // Safety check: if current round has no words, complete the session
    if (roundWords.length === 0) {
      console.log(`Round ${currentRound} has no words - completing session`);
      setTimeout(() => completeSession(), 100); // Complete after current render cycle
      return [];
    }
    
    return roundWords;
  };

  // NEW: Get progress data using RoundProgressionAPI (replaces all legacy functions)
  const getProgressData = () => {
    if (!currentSession) {
      return {
        global: { completed: 0, total: 0, currentWord: 1, percentage: 0 },
        round: { completed: 0, total: 0, percentage: 0 }
      };
    }

    const allWrongWords = currentSession.wrongWords.map(ww => ww.originalWord);
    const progressionState: RoundProgressionState = {
      currentRound,
      maxRounds: currentSession.maxRounds || 3,
      wordsFixed: wordsFixed,
      currentRoundWords: getWordsForCurrentRound(),
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
        currentWord: Math.min(dummyResult.progressData.globalProgress.completed + 1, dummyResult.progressData.globalProgress.total), // Global word position (1-26)
        percentage: dummyResult.progressData.globalProgress.percentage
      },
      round: {
        completed: dummyResult.progressData.roundProgress.completed,
        total: dummyResult.progressData.roundProgress.total,
        currentWord: dummyResult.progressData.roundProgress.currentWordInRound, // FIXED: Round word position (1-9, 1-9, 1-8)
        percentage: dummyResult.progressData.roundProgress.percentage
      }
    };
  };

  const checkWord = (input: string, targetWord: string): boolean => {
    return input.toLowerCase().trim() === targetWord.toLowerCase().trim();
  };

  // Get the current translated blank word for display/comparison
  const getCurrentTranslatedBlankWord = (): string | null => {
    const englishWord = getCurrentBlankWord();
    if (!englishWord) return null;
    
    const currentBlank = currentSession?.fillInBlankResult?.blanks.find(blank => blank.isBlank);
    const blankPosition = currentBlank?.position || 0;
    return getTranslatedBlankWord(englishWord, blankPosition);
  };

  // Get the translated word for comparison if translation is available
  const getTranslatedBlankWord = (englishWord: string, position: number): string => {
    const translatedSessionVerse = displayVerse;
    const sessionVerse = currentSession?.verse;
    
    if (translatedSessionVerse?.isTranslated && translatedSessionVerse.text && sessionVerse?.text) {
      // Split both verses into words
      const englishWords = sessionVerse.text.split(' ');
      const translatedWords = translatedSessionVerse.text.split(' ');
      
      console.log('🌍 Translation mapping debug:', {
        englishWord,
        position,
        englishWords,
        translatedWords,
        isTranslated: translatedSessionVerse.isTranslated,
        translationLanguage: translatedSessionVerse.translationLanguage
      });
      
      // Method 1: Try exact position mapping first (works for most cases)
      if (position < translatedWords.length) {
        const candidateWord = translatedWords[position];
        console.log('🎯 Position mapping candidate:', candidateWord);
        
        // For common translations, this should work
        if (candidateWord) {
          return candidateWord;
        }
      }
      
      // Method 2: Fallback - try to find by relative position for different sentence structures
      const cleanEnglishWord = englishWord.toLowerCase().replace(/[.,!?;:"']/g, '');
      const englishWordIndex = englishWords.findIndex((word, idx) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
        return cleanWord === cleanEnglishWord;
      });
      
      if (englishWordIndex !== -1 && englishWordIndex < translatedWords.length) {
        const translatedCandidate = translatedWords[englishWordIndex];
        console.log('🔄 Fallback mapping candidate:', translatedCandidate);
        return translatedCandidate || englishWord;
      }
      
      // Method 3: For very different sentence structures, use proportional mapping
      if (englishWords.length > 0 && translatedWords.length > 0) {
        const proportionalIndex = Math.floor((position / englishWords.length) * translatedWords.length);
        const proportionalWord = translatedWords[proportionalIndex];
        console.log('📊 Proportional mapping candidate:', proportionalWord);
        if (proportionalWord) {
          return proportionalWord;
        }
      }
    }
    
    // Fallback to English word
    console.log('🔙 Falling back to English word:', englishWord);
    return englishWord;
  };

  const handleWordSubmit = () => {
    if (submittingRef.current) return; 
    submittingRef.current = true; 
    setTimeout(() => { submittingRef.current = false; }, 250);
    
    if (!currentSession || !userInput.trim()) {
      console.log('🚨 handleWordSubmit: Early exit - no session or input');
      return;
    }

    // NEW API: Process word submission using SyntaxLabAPI
    try {
      const sessionData = convertToSessionData(currentSession);
      const result = SyntaxLabAPI.processWordSubmission(sessionData, userInput);
      
      console.log('🔍 NEW API Word submission result:', {
        isCorrect: result.isCorrect,
        shouldAdvance: result.shouldAdvance,
        currentWord: result.currentWord,
        userInput: userInput
      });
      
      if (!result.currentWord) {
        console.log('🚨 handleWordSubmit: No current word to process');
        return;
      }
    
      // Update session using new API
      const updatedSession = convertFromSessionData(result.updatedSession, currentSession);
      setCurrentSession(updatedSession);
      
      if (result.isCorrect) {
        // Show success animation
        showFloatingEmoji('✅', true);
        
        // Update words fixed for round progression integration
        const newWordsFixed = [...wordsFixed, result.currentWord];
        setWordsFixed(newWordsFixed);
        
        // Reset UI state
        setShowHint(false);
        setCurrentHint('');
        setShowAnswer(false);
        
        // Track weak word improvement
        const existingWeakWord = weakWords.find(w => w.word === result.currentWord);
        if (existingWeakWord) {
          existingWeakWord.timesCorrect += 1;
          if (existingWeakWord.timesCorrect >= 3) {
            existingWeakWord.mastered = true;
          }
          const updatedWeakWords = weakWords.map(w => 
            w.word === result.currentWord ? existingWeakWord : w
          );
          setWeakWords(updatedWeakWords);
          localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
        }
        
        // Check if session is completed
        if (SyntaxLabAPI.isSessionCompleted(result.updatedSession)) {
          console.log('🎉 Fill-in-blank session completed!');
          completeSession();
          return;
        }
        
        // Integrate with round progression API
        const allWrongWords = result.updatedSession.wrongWords || [];
        const progressionState: RoundProgressionState = {
          currentRound,
          maxRounds: currentSession.maxRounds || 3,
          wordsFixed: newWordsFixed,
          currentRoundWords: getWordsForCurrentRound(),
          totalWords: allWrongWords
        };
        
        const progressionResult = RoundProgressionAPI.processWordSubmission(
          progressionState,
          result.currentWord,
          true
        );
        
        if (progressionResult.shouldAdvanceRound && progressionResult.nextRoundState) {
          console.log('🚀 Advancing to next round');
          setCurrentRound(progressionResult.nextRoundState.currentRound);
          setWordsFixed([]);
          setCurrentWordIndex(0);
        } else if (progressionResult.shouldCompleteSession) {
          console.log('🎉 All rounds completed!');
          completeSession();
          return;
        }
        
      } else {
        // Show error animation
        showFloatingEmoji('❌', false);
        
        // Track mistake for weak words
        const existingWeakWord = weakWords.find(w => w.word === result.currentWord);
        if (!existingWeakWord) {
          const newWeakWord: WeakWord = {
            id: Date.now().toString(),
            word: result.currentWord,
            originalWord: result.currentWord,
            verse: currentSession.verse.reference || 'Unknown',
            reference: currentSession.verse.reference || 'Unknown',
            timesWrong: 1,
            timesCorrect: 0,
            lastMissed: new Date(),
            mastered: false
          };
          setWeakWords([...weakWords, newWeakWord]);
          localStorage.setItem('syntaxLabWeakWords', JSON.stringify([...weakWords, newWeakWord]));
        } else {
          existingWeakWord.timesWrong += 1;
          existingWeakWord.lastMissed = new Date();
          existingWeakWord.mastered = false;
          const updatedWeakWords = weakWords.map(w => 
            w.word === result.currentWord ? existingWeakWord : w
          );
          setWeakWords(updatedWeakWords);
          localStorage.setItem('syntaxLabWeakWords', JSON.stringify(updatedWeakWords));
        }
      }
      
    } catch (error) {
      console.error('🚨 Error processing word submission:', error);
      showFloatingEmoji('❌', false);
    }
    
    // Clear input for next word
    setUserInput('');
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

  // Generate AI-powered hint for word (cryptic clues, no spoilers)
  const generateHint = async (word: string): Promise<string> => {
    if (!word) return 'No hint available';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          hintRequest: true,
          targetWord: word,
          context: 'bible_verse_memorization'
        }),
      });

      if (!response.ok) {
        throw new Error('AI hint generation failed');
      }

      const data = await response.json();
      return data.hint || getFallbackHint(word);
    } catch (error) {
      console.error('AI hint generation failed:', error);
      return getFallbackHint(word);
    }
  };

  // Create floating emoji animation
  const showFloatingEmoji = (emoji: string, isCorrect: boolean) => {
    const x = Math.random() * 200 + 100; // Random horizontal position
    const y = Math.random() * 100 + 50;  // Random vertical position
    const id = Date.now().toString();
    
    setFloatingEmoji({ id, emoji, x, y });
    
    // Clear emoji after animation
    setTimeout(() => {
      setFloatingEmoji(null);
    }, 2000);
  };

  // Fallback non-spoiler hints
  const getFallbackHint = (word: string): string => {
    const firstLetter = word.charAt(0).toUpperCase();
    const length = word.length;
    
    // Generic cryptic hints without revealing the word
    const categoryHints: Record<string, string> = {
      'God': 'A three-letter divine name that commands reverence',
      'world': 'A five-letter noun describing our entire planet or realm',
      'loved': 'Past tense of a deep emotional connection (5 letters)',
      'gave': 'Past tense of granting or bestowing (4 letters)',
      'believes': 'Present tense of having faith or trust (8 letters)',
      'eternal': 'Describes something without beginning or end (7 letters)',
      'life': 'What makes us living beings (4 letters)',
      'perish': 'The opposite of surviving (6 letters)'
    };
    
    const specificHint = categoryHints[word.toLowerCase()];
    if (specificHint) return specificHint;
    
    // Generic hint pattern
    return `A ${length}-letter word starting with "${firstLetter}" - think about the verse context`;
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
    
    // Initialize Type-Along mode with multiple verses
    if (mode === 'type-along') {
      initializeTypeAlongSession();
    }
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

    const progressData = getProgressData().global;
    const finalSession = {
      ...currentSession,
      endTime: new Date(),
      finalAccuracy: progressData.percentage,
      improvementScore: Math.min(100, progressData.percentage + 10)
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
              if (phase === 'practice' || phase === 'flashcards' || phase === 'challenge' || phase === 'completion') {
                setPhase('summary'); // Go back to summary from other phases
              } else if (phase === 'summary' && currentSession) {
                // From summary with active session, go back to welcome menu
                setCurrentSession(null);
                setPhase('summary');
              } else {
                onBack(); // Only go back to memorization when no session (welcome menu)
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
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">🎯 {t('syntaxlab.fillInBlankMode')}</span>
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
                {practiceMode === 'blank' ? t('syntaxlab.fillInBlankMode') : t('syntaxlab.typeAlongMode')}
              </h2>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Round {currentRound}/{currentSession.maxRounds} • Word {getProgressData().round.currentWord}/{getProgressData().round.total}
                </div>
                {/* Enhanced Test Button for Word Submission Debug */}
                <button
                  onClick={() => {
                    console.log('🧪 ENHANCED TEST: Complete state analysis');
                    console.log('📊 Current State:', {
                      currentRound,
                      maxRounds: currentSession.maxRounds,
                      wordsFixed,
                      wordsFixedLength: wordsFixed.length,
                      userInput,
                      currentBlankWord: getCurrentBlankWord(),
                      currentRoundWords: getWordsForCurrentRound(),
                      progressData: getProgressData(),
                      fillInBlankResult: currentSession.fillInBlankResult
                    });
                    
                    // Test word filtering logic
                    const currentRoundWords = getWordsForCurrentRound();
                    const testWordsFixed = [...wordsFixed, 'lord']; // Simulate adding 'lord'
                    const remainingWords = currentRoundWords.filter(word => {
                      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
                      return !testWordsFixed.includes(cleanWord);
                    });
                    
                    console.log('🔍 Word Filtering Test:', {
                      currentRoundWords,
                      testWordsFixed,
                      remainingWords,
                      filteringWorks: remainingWords.length < currentRoundWords.length
                    });
                  }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition-colors"
                  title="Enhanced Debug: Complete word submission analysis"
                >
                  🔬 Debug
                </button>
                
                {/* Word Completion Debug */}
                <button
                  onClick={() => {
                    console.log('🔧 WORD COMPLETION DEBUG');
                    
                    const fillInBlankResult = currentSession?.fillInBlankResult;
                    const sessionVerse = currentSession?.verse;
                    const translatedVerse = displayVerse;
                    
                    console.log('📊 Completion Analysis:', {
                      wordsFixed: wordsFixed,
                      sessionVerseText: sessionVerse?.text,
                      translatedVerseText: translatedVerse?.text,
                      isTranslated: translatedVerse?.isTranslated,
                      fillInBlankResult: fillInBlankResult
                    });
                    
                    // Test completion matching
                    if (fillInBlankResult && sessionVerse) {
                      const words = sessionVerse.text.split(' ');
                      console.log('🔍 Word-by-word completion check:');
                      
                      words.forEach((word, index) => {
                        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
                        const isCompleted = wordsFixed.some(cw => 
                          cw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
                        );
                        
                        console.log(`Position ${index}: "${word}" (clean: "${cleanWord}") - ${isCompleted ? '✅ COMPLETED' : '⚪ NOT COMPLETED'}`);
                        
                        // Check what wordsFixed contains
                        wordsFixed.forEach(fixedWord => {
                          const cleanFixed = fixedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
                          console.log(`  Comparing "${cleanFixed}" === "${cleanWord}": ${cleanFixed === cleanWord}`);
                        });
                      });
                    }
                  }}
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded-md transition-colors"
                  title="Debug word completion matching"
                >
                  🔧 Debug Completion
                </button>
                
                {/* Fill-in-Blank Progression Debug */}
                <button
                  onClick={() => {
                    console.log('📝 FILL-IN-BLANK PROGRESSION DEBUG');
                    
                    const fillInBlankResult = currentSession?.fillInBlankResult;
                    const allBlanks = fillInBlankResult?.blanks || [];
                    const currentBlank = allBlanks.find(blank => blank.isBlank);
                    
                    console.log('🔍 Blank Progression Analysis:', {
                      totalBlanks: allBlanks.length,
                      currentBlankIndex: currentBlank?.position || 'none',
                      wordsFixed: wordsFixed,
                      wordsFixedCount: wordsFixed.length,
                      fillInBlankResult: fillInBlankResult
                    });
                    
                    console.log('📊 All Blanks Status:');
                    allBlanks.forEach((blank, index) => {
                      console.log(`Position ${blank.position}: "${blank.word}" - ${blank.isBlank ? '🟢 ACTIVE' : '⚪ COMPLETED'}`);
                    });
                    
                    console.log('🎯 Expected Behavior: Should show LEFTMOST active blank first');
                    
                    // Find what should be the current blank (leftmost active)
                    const leftmostBlank = allBlanks.find(blank => blank.isBlank);
                    const shouldBeCurrentWord = leftmostBlank?.word;
                    const actualCurrentWord = getCurrentBlankWord();
                    
                    console.log('🔄 Progression Check:', {
                      shouldBeCurrentWord,
                      actualCurrentWord,
                      match: shouldBeCurrentWord === actualCurrentWord ? '✅' : '❌',
                      leftmostBlankPosition: leftmostBlank?.position
                    });
                  }}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-md transition-colors"
                  title="Debug fill-in-blank progression from left to right"
                >
                  📝 Debug Progression
                </button>
                
                {/* Translation Debug Test */}
                <button
                  onClick={() => {
                    console.log('🌍 TRANSLATION DEBUG: Testing Spanish word mapping');
                    
                    const englishWord = getCurrentBlankWord();
                    const translatedWord = getCurrentTranslatedBlankWord();
                    const currentBlank = currentSession?.fillInBlankResult?.blanks.find(blank => blank.isBlank);
                    
                    console.log('🔍 Translation Debug Results:', {
                      englishWord,
                      translatedWord,
                      currentBlank,
                      displayVerse: displayVerse,
                      sessionVerse: currentSession?.verse,
                      selectedVerse: selectedVerse,
                      verseToTranslate: verseToTranslate,
                      isTranslated: displayVerse?.isTranslated,
                      translationLanguage: displayVerse?.translationLanguage,
                      hasCurrentSession: !!currentSession,
                      hasSelectedVerse: !!selectedVerse
                    });
                    
                    // Test Spanish inputs
                    const spanishTestInputs = ['SEÑOR', 'señor', 'Señor', 'LORD', 'lord'];
                    
                    spanishTestInputs.forEach(input => {
                      const cleanTranslated = translatedWord?.toLowerCase().replace(/[.,!?;:"']/g, '') || '';
                      const cleanEnglish = englishWord?.toLowerCase().replace(/[.,!?;:"']/g, '') || '';
                      const cleanInput = input.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
                      
                      const matchesTranslated = cleanInput === cleanTranslated;
                      const matchesEnglish = cleanInput === cleanEnglish;
                      
                      console.log(`Testing "${input}":`, {
                        input,
                        cleanInput,
                        cleanTranslated,
                        cleanEnglish,
                        matchesTranslated: matchesTranslated ? '✅' : '❌',
                        matchesEnglish: matchesEnglish ? '✅' : '❌',
                        shouldAccept: matchesTranslated ? 'YES' : 'NO'
                      });
                    });
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md transition-colors"
                  title="Debug Spanish translation mapping"
                >
                  🌍 Debug Translation
                </button>
                
                {/* Specific Test for Shepherd Bug */}
                <button
                  onClick={() => {
                    console.log('🐑 SHEPHERD TEST: Debugging word acceptance');
                    const currentBlankWord = getCurrentBlankWord();
                    const testInputs = ['shepherd', 'shepherd,', 'Shepherd', 'Shepherd,'];
                    
                    console.log('📝 Current blank word:', currentBlankWord);
                    
                    testInputs.forEach(input => {
                      const cleanBlankWord = currentBlankWord?.toLowerCase().replace(/[.,!?;:"']/g, '') || '';
                      const cleanUserInput = input.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
                      const isCorrect = cleanUserInput === cleanBlankWord;
                      
                      console.log(`Testing "${input}":`, {
                        input,
                        cleanUserInput,
                        cleanBlankWord,
                        isCorrect,
                        comparison: `"${cleanUserInput}" === "${cleanBlankWord}"`
                      });
                    });
                  }}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-md transition-colors"
                  title="Test shepherd word specifically"
                >
                  🐑 Test
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressData().global.percentage}%` }}
                ></div>
              </div>
            </div>

            {practiceMode === 'blank' && (
              <div className="space-y-8">
                {/* Enhanced Fill-in-the-Blank Display */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-2">🎯 {t('syntaxlab.fillInBlankPractice')}</h3>
                    <p className="text-sm text-emerald-600">{t('syntaxlab.fillInBlanksDescription')}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-inner border border-emerald-100 overflow-hidden">
                    <div className="text-xl leading-relaxed text-center font-medium break-words overflow-wrap-anywhere max-w-full hyphens-auto" style={{ hyphens: 'auto', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {(() => {
                        const displayText = translatedSessionVerse?.text || sessionVerse?.text || '';
                        return displayText.split(' ').map((word, index) => {
                        // Use progressive fill-in-blank logic if available
                        const fillInBlankResult = currentSession.fillInBlankResult;
                        const blankWord = fillInBlankResult?.blanks?.[index];
                        
                        // Check if this word should be blanked according to progressive logic
                        const isCurrentBlank = blankWord?.isBlank || false;
                        
                        // Check if word is completed (for styling)
                        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
                        const isWordCompleted = wordsFixed.some(fixed => 
                          fixed.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
                        );
                        
                        if (isCurrentBlank && blankWord) {
                          // Show proper blank for fill-in-the-blank mode (progressive left-to-right)
                          return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-sm opacity-30 animate-pulse"></span>
                              <span className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                                {blankWord.underscores}
                              </span>
                            </span>
                          );
                        } else if (isWordCompleted) {
                          // Completed words - clean styling with blue gradient
                          return (
                            <span key={index} className="relative inline-block mx-1">
                              <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-lg font-medium shadow-md">
                                {word}
                              </span>
                            </span>
                          );
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
                </div>

                {/* Enhanced Input Section */}
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
                          onClick={async () => {
                            if (showHint) {
                              setShowHint(false);
                              setCurrentHint('');
                            } else {
                              setIsLoadingHint(true);
                              setShowHint(true);
                              try {
                                const wordForHint = getCurrentTranslatedBlankWord();
                                const hint = await generateHint(wordForHint || '');
                                setCurrentHint(hint);
                              } catch (error) {
                                console.error('Hint generation failed:', error);
                                const wordForHint = getCurrentTranslatedBlankWord();
                                setCurrentHint(getFallbackHint(wordForHint || ''));
                              } finally {
                                setIsLoadingHint(false);
                              }
                            }
                          }}
                          className="text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-full transition-colors duration-200 disabled:opacity-50"
                          disabled={isLoadingHint}
                        >
                          💡 {isLoadingHint ? 'Generating...' : showHint ? 'Hide Hint' : 'Get Hint'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAnswer(!showAnswer);
                          }}
                          className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-full transition-colors duration-200"
                        >
                          🔍 {showAnswer ? 'Hide Answer' : 'Show Answer'}
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
                            {getCurrentTranslatedBlankWord() || (getProgressData().global.percentage >= 100 ? 'All completed! 🎉' : 'No blank found')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced input with better styling */}
                    <div className="relative max-w-lg mx-auto">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleWordSubmit(); } }}
                        placeholder="Type the missing word..."
                        className="w-full p-4 text-xl text-center border-3 border-emerald-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 bg-gradient-to-r from-emerald-50 to-teal-50 font-medium shadow-lg"
                        autoFocus
                      />
                    </div>

                    {/* Enhanced submit button */}
                    <button type="button" onClick={handleWordSubmit}
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
                    
                    {/* Proceed to Results button when 100% complete */}
                    {getProgressData().global.percentage >= 100 && (
                      <button
                        onClick={completeSession}
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

                {/* Progress indicator */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Progress: {wordsFixed.length} / {currentSession?.fillInBlankResult?.totalBlanks || getProgressData().global.total} words
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {getProgressData().global.percentage}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-3 mt-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${getProgressData().global.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {practiceMode === 'type-along' && (
              <div className="space-y-8">
                {showTypeAlongResults ? (
                  /* Type-Along Results Dashboard */
                  <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
                      <BarChart className="w-8 h-8 mr-3 text-purple-600" />
                      📊 Type-Along Session Results
                    </h2>
                    
                    {/* Session Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 text-center border border-emerald-200">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">{verseCompletionData.length}</div>
                        <div className="text-emerald-700 font-medium">Verses Completed</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-200">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {verseCompletionData.length > 0 ? Math.round(verseCompletionData.reduce((sum, v) => sum + v.accuracy, 0) / verseCompletionData.length) : 0}%
                        </div>
                        <div className="text-blue-700 font-medium">Average Accuracy</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 text-center border border-purple-200">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {verseCompletionData.length > 0 ? Math.round(verseCompletionData.reduce((sum, v) => sum + v.timeSpent, 0) / verseCompletionData.length) : 0}s
                        </div>
                        <div className="text-purple-700 font-medium">Avg Time per Verse</div>
                      </div>
                    </div>
                    
                    {/* Individual Verse Results */}
                    <div className="space-y-4 mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Individual Verse Performance</h3>
                      {verseCompletionData.map((result, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800">{result.verse.reference}</h4>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              result.accuracy >= 90 ? 'bg-green-100 text-green-700' :
                              result.accuracy >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              result.accuracy > 0 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {result.accuracy > 0 ? `${result.accuracy}% accuracy` : 'Skipped'}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{result.verse.text}</p>
                          <div className="text-xs text-gray-500">
                            Time spent: {result.timeSpent}s • Completed: {result.completedAt.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => {
                          setShowTypeAlongResults(false);
                          initializeTypeAlongSession();
                        }}
                        className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <RotateCcw className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-300" />
                        <span className="relative z-10">🔄 Start New Session</span>
                      </button>
                      
                      <button
                        onClick={onStartNewSession}
                        className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <BookOpen className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="relative z-10">📚 Practice Different Verses</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Type-Along Practice Interface */
                  <>
                    {/* Session Progress Header */}
                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-indigo-800">🧠 Type-Along Practice</h3>
                        <div className="text-sm text-indigo-600 font-medium">
                          Verse {currentVerseIndex + 1} of {typeAlongVerses.length}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${((currentVerseIndex + 1) / typeAlongVerses.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm text-indigo-600 font-medium">
                          {currentVerseIndex + 1}/{typeAlongVerses.length}
                        </div>
                      </div>
                    </div>
                    
                    {getCurrentTypeAlongVerse() && (
                      <>
                        {/* Verse Display */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-indigo-200">
                          <div className="text-center mb-6">
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">{getCurrentTypeAlongVerse()!.reference}</h4>
                            <p className="text-sm text-gray-600">Type the complete verse below. Watch the real-time feedback!</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-200 mb-6 overflow-visible">
                            <p className="text-lg leading-relaxed text-center font-medium text-gray-700 whitespace-normal break-words min-h-fit">
                              {translatedTypeAlongVerse?.text || currentTypeAlongVerse?.text}
                            </p>
                            {translatedTypeAlongVerse?.isTranslated && (
                              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-2 text-center">
                                🌍 Auto-translated to {translatedTypeAlongVerse.translationLanguage?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Full Verse Input */}
                          <div className="space-y-4">
                            <div className="relative">
                              <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Start typing the complete verse here..."
                                className="w-full p-4 text-lg border-2 border-purple-300 rounded-2xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 bg-gradient-to-r from-purple-50 to-indigo-50 font-medium shadow-lg resize-none"
                                rows={4}
                                autoFocus
                              />
                              
                              {/* Real-time accuracy feedback */}
                              {userInput && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                  <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                    calculateVerseAccuracy(userInput, getCurrentTypeAlongVerse()!.text) >= 80
                                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                                      : calculateVerseAccuracy(userInput, getCurrentTypeAlongVerse()!.text) >= 60
                                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200'
                                      : 'bg-red-100 text-red-700 border-2 border-red-200'
                                  }`}>
                                    {calculateVerseAccuracy(userInput, getCurrentTypeAlongVerse()!.text)}% accuracy
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
                          <div className="flex flex-col space-y-4">
                            {/* Next Verse Button - Only show when accuracy >= 80% */}
                            {calculateVerseAccuracy(userInput, getCurrentTypeAlongVerse()!.text) >= 80 && (
                              <button
                                onClick={() => {
                                  const accuracy = calculateVerseAccuracy(userInput, getCurrentTypeAlongVerse()!.text);
                                  handleVerseCompletion(accuracy);
                                  if (currentVerseIndex < typeAlongVerses.length - 1) {
                                    moveToNextVerse();
                                  } else {
                                    setShowTypeAlongResults(true);
                                  }
                                }}
                                className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg font-semibold text-lg border-2 border-white/20 backdrop-blur-sm"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                                <ChevronRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                                <span className="relative z-10">
                                  🎉 {currentVerseIndex < typeAlongVerses.length - 1 ? 'Next Verse' : 'View Results'}
                                </span>
                              </button>
                            )}
                            
                            {/* Secondary Action Buttons */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                              <button
                                onClick={() => setShowTypeAlongResults(true)}
                                disabled={!hasCompletedFirstVerse}
                                className={`group relative flex items-center justify-center space-x-3 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-md ${
                                  hasCompletedFirstVerse
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <BarChart className="w-4 h-4" />
                                <span>📊 View Results</span>
                              </button>
                              
                              <button
                                onClick={skipCurrentVerse}
                                className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-md font-medium text-sm"
                              >
                                <SkipForward className="w-4 h-4" />
                                <span>⏭️ Skip Verse</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
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

        {/* Phase: Completion - 100% Success Screen */}
        {phase === 'completion' && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-green-200 animate-fade-in">
            <div className="text-center space-y-6">
              {/* Celebration Header */}
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-green-600 mb-4">Perfect Score!</h2>
              <p className="text-xl text-gray-700 mb-6">
                You completed all fill-in-the-blank words correctly!
              </p>

              {/* Achievement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                  <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                  <div className="text-green-700 font-medium">Completion</div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{getProgressData().global.completed}</div>
                  <div className="text-blue-700 font-medium">Words Mastered</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">⭐</div>
                  <div className="text-purple-700 font-medium">Perfect Score</div>
                </div>
              </div>

              {/* Reward Message */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                  🏆 Congratulations!
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  You've demonstrated excellent Scripture memorization skills! Your dedication to learning God's Word 
                  is truly commendable. Keep practicing to build even stronger foundations in faith.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setPhase('flashcards')}
                  className="button-primary flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Zap className="w-4 h-4" />
                  <span>Continue to Challenge</span>
                </button>
                
                <button
                  onClick={completeSession}
                  className="button-secondary flex items-center space-x-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>View Final Results</span>
                </button>
                
                <button
                  onClick={onStartNewSession}
                  className="button-primary flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Practice New Verse</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Scorecard */}
        {phase === 'scorecard' && stats && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🏆 Session Complete!</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{wordsFixed.length}/{currentSession?.fillInBlankResult?.totalBlanks || getProgressData().global.total}</div>
                <div className="text-green-700">Mistakes Fixed</div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{getProgressData().global.percentage}%</div>
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
                    You mastered {getProgressData().global.completed} challenging words today—keep it up! 
                    {getProgressData().global.percentage >= 80 && " You're becoming a Scripture master!"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={currentSession?.id?.startsWith('auto-session-') ? startAutoPractice : restartRegularPractice}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center space-x-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  🔄 {currentSession?.id?.startsWith('auto-session-') ? 'Restart Auto Practice' : 'Restart Practice'}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentSession(null);
                  setPhase('summary');
                }}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center space-x-2 mx-auto"
              >
                <Target className="w-4 h-4" />
                <span>🎯 Back to Menu</span>
              </button>
              
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