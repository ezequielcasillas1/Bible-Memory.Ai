import React from 'react';
import { Zap } from 'lucide-react';
import { FlashcardsPhaseProps } from './types';

interface FlashcardsPhaseExtendedProps extends FlashcardsPhaseProps {
  startChallenge: () => void;
}

const FlashcardsPhase: React.FC<FlashcardsPhaseExtendedProps> = ({
  startChallenge
}) => {
  return (
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
  );
};

export default FlashcardsPhase;
