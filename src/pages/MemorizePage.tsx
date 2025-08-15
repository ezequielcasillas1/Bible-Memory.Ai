import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Lightbulb, Brain } from 'lucide-react';
import { Verse, MemorizationSession } from '../types';
import { calculateAccuracy, generateFeedback } from '../utils/scoring';
import CountdownTimer from '../components/CountdownTimer';

interface MemorizePageProps {
  selectedVerse: Verse | null;
  studyTime: number;
  onComplete: (points: number) => void;
  onBackToGenerator: () => void;
}

type MemorizationPhase = 'study' | 'input' | 'feedback';

const MemorizePage: React.FC<MemorizePageProps> = ({ 
  selectedVerse, 
  studyTime, 
  onComplete, 
  onBackToGenerator 
}) => {
  const [phase, setPhase] = useState<MemorizationPhase>('study');
  const [timeLeft, setTimeLeft] = useState(studyTime);
  const [isActive, setIsActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [result, setResult] = useState<{
    accuracy: number;
    feedback: string;
    suggestions: string[];
  } | null>(null);
  const [practiceTime, setPracticeTime] = useState(0);

  // Initialize session when verse is selected
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

  const startStudy = () => {
    setIsActive(true);
    setTimeLeft(studyTime);
  };

  const togglePause = () => {
    setIsActive(!isActive);
  };

  const checkAnswer = () => {
    if (!session || !userInput.trim()) return;

    const accuracy = calculateAccuracy(userInput, session.verse.text);
    const { feedback, suggestions } = generateFeedback(accuracy, userInput, session.verse.text);
    
    setResult({ accuracy, feedback, suggestions });
    
    const updatedSession = {
      ...session,
      attempts: session.attempts + 1,
      accuracy,
      completed: accuracy >= 70
    };
    
    setSession(updatedSession);
    setPhase('feedback');
    
    // Award points based on accuracy
    const points = Math.round(accuracy * 1.5);
    onComplete(points);
  };

  const retry = () => {
    setPhase('study');
    setTimeLeft(studyTime);
    setIsActive(false);
    setUserInput('');
    setResult(null);
    setPracticeTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
        {/* Study Phase */}
        {phase === 'study' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Study Your Verse</h2>
              <p className="text-gray-600">Memorize this verse before the timer runs out</p>
            </div>

            <CountdownTimer 
              timeLeft={timeLeft} 
              totalTime={studyTime} 
              isActive={isActive} 
            />

            {/* Verse Display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <p className="text-lg leading-relaxed text-gray-700 mb-4 italic text-center">
                "{selectedVerse.text}"
              </p>
              <p className="text-purple-600 font-medium text-center">
                {selectedVerse.reference}
              </p>
            </div>

            <div className="text-center space-x-4">
              {!isActive && timeLeft === studyTime ? (
                <button onClick={startStudy} className="button-primary">
                  Start Study Session
                </button>
              ) : (
                <button
                  onClick={togglePause}
                  className="button-secondary flex items-center space-x-2 mx-auto"
                >
                  {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Recite from Memory</h2>
              <p className="text-gray-600">Type the verse as accurately as you can remember</p>
              <p className="text-purple-600 font-medium mt-2">{selectedVerse.reference}</p>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  {formatTime(practiceTime)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the verse from memory..."
                className="w-full p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-lg"
                rows={4}
                autoFocus
              />
              
              <div className="text-center">
                <button
                  onClick={checkAnswer}
                  disabled={!userInput.trim()}
                  className="button-primary disabled:opacity-50"
                >
                  Check My Answer
                </button>
              </div>
            </div>
          </>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && result && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Results</h2>
              <p className="text-gray-600">Here's how you did with your memorization</p>
            </div>

            {/* Accuracy Score */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4 animate-celebration ${
                result.accuracy >= 90 ? 'bg-green-100 text-green-600' :
                result.accuracy >= 70 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {result.accuracy}%
              </div>
              <p className={`text-lg font-semibold ${
                result.accuracy >= 90 ? 'text-green-600' :
                result.accuracy >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {result.feedback}
              </p>
            </div>

            {/* Improvement Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                  Improvement Tips
                </h3>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Original Verse */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Original Verse</h3>
              <p className="text-lg leading-relaxed text-gray-700 italic">
                "{selectedVerse.text}"
              </p>
              <p className="text-purple-600 font-medium mt-2">
                {selectedVerse.reference}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={retry}
                className="button-secondary flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={onBackToGenerator}
                className="button-primary"
              >
                New Verse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemorizePage;