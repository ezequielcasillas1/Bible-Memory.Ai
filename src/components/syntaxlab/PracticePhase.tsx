import React from 'react';
import { PracticePhaseProps } from './types';
import FillInBlankPractice from './FillInBlankPractice';
import TypeAlongPractice from './TypeAlongPractice';

const PracticePhase: React.FC<PracticePhaseProps> = (props) => {
  const { practiceMode, currentSession } = props;

  if (!currentSession) return null;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {practiceMode === 'blank' ? props.t('syntaxlab.fillInBlankMode') : props.t('syntaxlab.typeAlongMode')}
        </h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Round {props.currentRound}/{currentSession.maxRounds}
          </div>
        </div>
      </div>

      {practiceMode === 'blank' ? (
        <FillInBlankPractice {...props} />
      ) : (
        <TypeAlongPractice {...props} />
      )}
    </div>
  );
};

export default PracticePhase;
