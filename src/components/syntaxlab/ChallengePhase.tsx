import React from 'react';
import { Trophy } from 'lucide-react';
import { ChallengePhaseProps } from './types';

interface ChallengePhaseExtendedProps extends ChallengePhaseProps {
  completeSession: () => void;
}

const ChallengePhase: React.FC<ChallengePhaseExtendedProps> = ({
  challengeTimeLeft,
  completeSession
}) => {
  return (
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
  );
};

export default ChallengePhase;
