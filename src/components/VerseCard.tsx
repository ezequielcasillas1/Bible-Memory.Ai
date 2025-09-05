import React from 'react';
import { Globe } from 'lucide-react';
import { Verse } from '../types';
import { useAutoTranslatedVerse } from '../hooks/useAutoTranslatedVerse';

interface VerseCardProps {
  verse: Verse;
  onMemorize: (verse: Verse) => void;
  onTranslate?: (verse: Verse) => void;
}

const VerseCard: React.FC<VerseCardProps> = ({ verse, onMemorize, onTranslate }) => {
  // Use auto-translated verse if available, otherwise use original verse
  const displayVerse = useAutoTranslatedVerse(verse) || verse;
  
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
          "{displayVerse.text}"
        </p>
        {displayVerse.isTranslated && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2 inline-block">
            🌍 Auto-translated to {displayVerse.translationLanguage?.toUpperCase()}
          </div>
        )}
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
        {displayVerse.reason && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
            💡 {displayVerse.reason}
          </p>
        )}
        {displayVerse.context && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-blue-50 rounded-lg">
            📚 <strong>Context:</strong> {displayVerse.context}
          </p>
        )}
        {displayVerse.application && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-green-50 rounded-lg">
            🌱 <strong>Application:</strong> {displayVerse.application}
          </p>
        )}
        {displayVerse.memoryTips && (
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-purple-50 rounded-lg">
            🧠 <strong>Memory Tips:</strong> {displayVerse.memoryTips}
          </p>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => onMemorize(verse)}
          className="button-primary flex-1"
        >
          Transfer to Memorize
        </button>
        
        {onTranslate && (
          <button
            onClick={() => onTranslate(verse)}
            className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            title="Translate to other languages"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Translate</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VerseCard;