import React from 'react';
import { CheckCircle, X, Target, Brain } from 'lucide-react';
import { SyntaxLabPhaseProps, PracticeMode } from './types';
import { Verse } from '../../types';

interface SummaryPhaseProps extends SyntaxLabPhaseProps {
  startPractice: (mode: PracticeMode) => void;
}

const SummaryPhase: React.FC<SummaryPhaseProps> = ({
  currentSession,
  comparisonResult,
  t,
  startPractice
}) => {
  if (!currentSession) return null;

  return (
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
          {currentSession.wrongWords.map((word: any, index: number) => (
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
  );
};

export default SummaryPhase;
