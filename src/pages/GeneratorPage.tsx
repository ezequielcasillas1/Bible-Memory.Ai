import React, { useState } from 'react';
import { RefreshCw, Heart } from 'lucide-react';
import { VerseType, Verse } from '../types';
import { commissionVerses, helpVerses, connections } from '../data/verses';
import VerseCard from '../components/VerseCard';

interface GeneratorPageProps {
  onMemorizeVerse: (verse: Verse) => void;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onMemorizeVerse }) => {
  const [verseType, setVerseType] = useState<VerseType>('commission');
  const [currentVerses, setCurrentVerses] = useState({
    oldTestament: commissionVerses.find(v => v.testament === 'OT'),
    newTestament: commissionVerses.find(v => v.testament === 'NT')
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateNewVerses = () => {
    setIsLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const verses = verseType === 'commission' ? commissionVerses : helpVerses;
      const otVerses = verses.filter(v => v.testament === 'OT');
      const ntVerses = verses.filter(v => v.testament === 'NT');
      
      const randomOT = otVerses[Math.floor(Math.random() * otVerses.length)];
      const randomNT = ntVerses[Math.floor(Math.random() * ntVerses.length)];
      
      setCurrentVerses({
        oldTestament: randomOT,
        newTestament: randomNT
      });
      setIsLoading(false);
    }, 800);
  };

  const handleVerseTypeChange = (type: VerseType) => {
    setVerseType(type);
    const verses = type === 'commission' ? commissionVerses : helpVerses;
    setCurrentVerses({
      oldTestament: verses.find(v => v.testament === 'OT'),
      newTestament: verses.find(v => v.testament === 'NT')
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Receive Today's Commission or Help People Verses
        </h1>
        
        {/* Verse Type Toggle */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => handleVerseTypeChange('commission')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              verseType === 'commission'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            Commission Verses
          </button>
          <button
            onClick={() => handleVerseTypeChange('help')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              verseType === 'help'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            Help People Verses
          </button>
        </div>
      </div>

      {/* Verses Display */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
          {currentVerses.oldTestament && (
            <VerseCard 
              verse={currentVerses.oldTestament} 
              onMemorize={onMemorizeVerse}
            />
          )}
          {currentVerses.newTestament && (
            <VerseCard 
              verse={currentVerses.newTestament} 
              onMemorize={onMemorizeVerse}
            />
          )}
        </div>
      )}

      {/* Connection Insight */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200 animate-slide-up">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-bold text-gray-800">Connection Insight</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {connections[verseType]}
        </p>
      </div>

      {/* Generate New Verses Button */}
      <div className="flex justify-center">
        <button
          onClick={generateNewVerses}
          disabled={isLoading}
          className="button-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Generate New Verses</span>
        </button>
      </div>
    </div>
  );
};

export default GeneratorPage;