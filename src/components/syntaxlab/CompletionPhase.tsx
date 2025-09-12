import React from 'react';
import { Zap, Trophy, BookOpen } from 'lucide-react';
import { CompletionPhaseProps } from './types';

interface CompletionPhaseExtendedProps extends CompletionPhaseProps {
  getProgressData: () => { global: { completed: number; total: number; percentage: number } };
  completeSession: () => void;
}

const CompletionPhase: React.FC<CompletionPhaseExtendedProps> = ({
  setPhase,
  onStartNewSession,
  getProgressData,
  completeSession
}) => {
  const progressData = getProgressData();

  return (
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
            <div className="text-4xl font-bold text-blue-600 mb-2">{progressData.global.completed}</div>
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
  );
};

export default CompletionPhase;
