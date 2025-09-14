import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { AISummaryPhaseProps } from './types';
import { AIService } from '../../services/aiService';

interface AISummaryPhaseExtendedProps extends AISummaryPhaseProps {
  practiceWrongWords: Array<{word: string, userAttempt: string, expectedWord: string}>;
}

const AISummaryPhase: React.FC<AISummaryPhaseExtendedProps> = ({
  currentSession,
  practiceWrongWords,
  setPhase,
  getProgressData,
  t
}) => {
  const [aiSummary, setAiSummary] = useState<{
    feedback: string;
    analysis: string;
    strategies: string[];
    spiritualInsight: string;
    nextSteps: string;
    encouragement: string;
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const progressData = getProgressData();
  const hasWrongWords = practiceWrongWords.length > 0;

  useEffect(() => {
    generateAISummary();
  }, []);

  const generateAISummary = async () => {
    if (!currentSession) return;
    
    setIsLoadingAI(true);
    setError(null);

    try {
      if (hasWrongWords) {
        // Create a summary of wrong attempts for AI analysis
        const wrongWordsSummary = practiceWrongWords.map(w => 
          `Expected: "${w.expectedWord}" → User typed: "${w.userAttempt}"`
        ).join(', ');
        
        const userInput = `Practice session completed. Wrong words: ${wrongWordsSummary}`;
        const originalVerse = currentSession.verse.text;
        const accuracy = Math.round(((progressData.global.total - practiceWrongWords.length) / progressData.global.total) * 100);
        
        // Use existing AI service for personalized feedback
        const feedback = await AIService.getPersonalizedFeedback(
          userInput,
          originalVerse,
          accuracy,
          { 
            totalPoints: 0,
            versesMemorized: 1, 
            currentStreak: 1, 
            longestStreak: 1,
            averageAccuracy: accuracy,
            totalPracticeTime: 0,
            achievements: [],
            weeklyGoal: 5,
            dailyGoal: 1,
            preferredVersion: 'NIV'
          } // Mock user stats
        );
        
        setAiSummary(feedback);
      } else {
        // Perfect score - generate positive feedback
        setAiSummary({
          feedback: "Outstanding work! You completed all fill-in-the-blank words correctly!",
          analysis: "You demonstrated excellent recall and accuracy throughout your practice session.",
          strategies: [
            "Continue practicing regularly to maintain this level of mastery",
            "Try challenging yourself with longer verses",
            "Consider practicing under time pressure to build confidence",
            "Share your memorization techniques with others"
          ],
          spiritualInsight: "Your dedication to memorizing Scripture shows a heart committed to treasuring God's Word. Keep storing these precious truths in your heart.",
          nextSteps: "You're ready for more challenging verses or can help others with their memorization journey.",
          encouragement: "Perfect score! You're becoming a true Scripture memory champion! 🏆"
        });
      }
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      setError('Unable to generate AI summary. Proceeding with session completion.');
      
      // Fallback summary
      setAiSummary({
        feedback: hasWrongWords 
          ? `You completed the practice session with ${practiceWrongWords.length} words to review.`
          : "Great job completing your practice session!",
        analysis: hasWrongWords 
          ? "Focus on the words you found challenging and practice them more frequently."
          : "You showed excellent memorization skills throughout this session.",
        strategies: [
          "Practice the challenging words separately",
          "Break difficult words into smaller parts",
          "Use the verse context to help remember word meanings",
          "Review these words again tomorrow"
        ],
        spiritualInsight: "Every verse you memorize becomes a treasure stored in your heart for life.",
        nextSteps: "Continue practicing to strengthen your Scripture memory foundation.",
        encouragement: hasWrongWords 
          ? "Don't be discouraged by mistakes - they're part of the learning process!"
          : "Excellent work! Keep up the great memorization habits!"
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoadingAI) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-200 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Analyzing Your Practice Session</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">AI is generating personalized feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !aiSummary) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-200 animate-fade-in">
        <div className="text-center space-y-6">
          <XCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">Unable to Generate AI Summary</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => setPhase('completion')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Results
          </button>
        </div>
      </div>
    );
  }

  if (!aiSummary) return null;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Practice Summary</h2>
        <p className="text-gray-600">Personalized feedback for your memorization session</p>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {progressData.global.total - practiceWrongWords.length}
          </div>
          <div className="text-green-700 text-sm font-medium">Correct Words</div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {practiceWrongWords.length}
          </div>
          <div className="text-red-700 text-sm font-medium">Words to Review</div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {Math.round(((progressData.global.total - practiceWrongWords.length) / progressData.global.total) * 100)}%
          </div>
          <div className="text-blue-700 text-sm font-medium">Accuracy</div>
        </div>
      </div>

      {/* Wrong Words List (if any) */}
      {hasWrongWords && (
        <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            Words to Focus On
          </h3>
          <div className="space-y-2">
            {practiceWrongWords.map((wrongWord, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">Expected: "{wrongWord.expectedWord}"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-red-600">You typed: "{wrongWord.userAttempt}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback Sections */}
      <div className="space-y-6">
        {/* Main Feedback */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3">📝 Session Feedback</h3>
          <p className="text-gray-700 leading-relaxed">{aiSummary.feedback}</p>
        </div>

        {/* Analysis */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-800 mb-3">🔍 Analysis</h3>
          <p className="text-gray-700 leading-relaxed">{aiSummary.analysis}</p>
        </div>

        {/* Strategies */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-3">💡 Memorization Strategies</h3>
          <ul className="space-y-2">
            {aiSummary.strategies.map((strategy, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{strategy}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Spiritual Insight */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-3">✨ Spiritual Insight</h3>
          <p className="text-gray-700 leading-relaxed italic">{aiSummary.spiritualInsight}</p>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-3">🎯 Next Steps</h3>
          <p className="text-gray-700 leading-relaxed">{aiSummary.nextSteps}</p>
        </div>

        {/* Encouragement */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 text-center">
          <h3 className="font-bold text-yellow-800 mb-3">🌟 Encouragement</h3>
          <p className="text-gray-700 leading-relaxed text-lg font-medium">{aiSummary.encouragement}</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => setPhase('completion')}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <span>Continue to Final Results</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default AISummaryPhase;
