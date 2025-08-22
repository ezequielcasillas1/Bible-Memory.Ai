import React from 'react';
import { Verse } from '../types';

interface VerseCardProps {
  verse: Verse;
  onMemorize: (verse: Verse) => void;
}

const VerseCard: React.FC<VerseCardProps> = ({ verse, onMemorize }) => {
  return (
    <div className="verse-card bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          {verse.testament === 'OT' ? 'Old Testament' : 'New Testament'}
        </h3>
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
          verse.testament === 'OT' 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {verse.testament}
        </span>
      </div>
      
      <div className="mb-6">
        <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 italic">
          "{verse.text}"
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-purple-600 font-medium text-sm sm:text-base">
            {verse.reference}
          </p>
          {verse.version && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded self-start sm:self-auto">
              {verse.version}
            </span>
          )}
        </div>
        {verse.reason && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
            💡 {verse.reason}
          </p>
        )}
        {verse.context && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-blue-50 rounded-lg">
            📚 <strong>Context:</strong> {verse.context}
          </p>
        )}
        {verse.application && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-green-50 rounded-lg">
            🌱 <strong>Application:</strong> {verse.application}
          </p>
        )}
        {verse.memoryTips && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-purple-50 rounded-lg">
            🧠 <strong>Memory Tips:</strong> {verse.memoryTips}
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