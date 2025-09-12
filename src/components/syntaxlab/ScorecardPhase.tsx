import React from 'react';
import { TrendingUp, Lightbulb, RotateCcw, Target, BookOpen, ArrowLeft } from 'lucide-react';
import { ScorecardPhaseProps } from './types';

interface ScorecardPhaseExtendedProps extends ScorecardPhaseProps {
  getProgressData: () => { global: { completed: number; total: number; percentage: number } };
  startAutoPractice: () => void;
  restartRegularPractice: () => void;
}

const ScorecardPhase: React.FC<ScorecardPhaseExtendedProps> = ({
  stats,
  currentSession,
  setPhase,
  onStartNewSession,
  onBack,
  getProgressData,
  startAutoPractice,
  restartRegularPractice
}) => {
  if (!stats) return null;

  const progressData = getProgressData();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🏆 Session Complete!</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-2">{progressData.global.completed}/{progressData.global.total}</div>
          <div className="text-green-700">Mistakes Fixed</div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">{progressData.global.percentage}%</div>
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
              You mastered {progressData.global.completed} challenging words today—keep it up! 
              {progressData.global.percentage >= 80 && " You're becoming a Scripture master!"}
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
  );
};

export default ScorecardPhase;
