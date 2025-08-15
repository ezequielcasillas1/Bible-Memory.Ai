import React from 'react';
import { Verse } from '../types';

interface VerseCardProps {
  verse: Verse;
  onMemorize: (verse: Verse) => void;
}

const VerseCard: React.FC<VerseCardProps> = ({ verse, onMemorize }) => {
  return (
    <div className="verse-card bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {verse.testament === 'OT' ? 'Old Testament' : 'New Testament'}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          verse.testament === 'OT' 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {verse.testament}
        </span>
      </div>
      
      <div className="mb-6">
        <p className="text-lg leading-relaxed text-gray-700 mb-4 italic">
          "{verse.text}"
        </p>
        <div className="flex items-center justify-between">
          <p className="text-purple-600 font-medium">
            {verse.reference}
          </p>
          {verse.version && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {verse.version}
            </span>
          )}
        </div>
        {verse.reason && (
          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
            💡 {verse.reason}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onMemorize(verse)}
        className="button-primary w-full"
      >
        Transfer to Memorize
      </button>
    </div>
  );
};

export default VerseCard;