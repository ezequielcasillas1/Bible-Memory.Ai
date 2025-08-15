import React, { useState } from 'react';
import { RefreshCw, Heart, Sparkles } from 'lucide-react';
import { VerseType, Verse, AppSettings } from '../types';
import { commissionVerses, helpVerses, connections } from '../data/verses';
import { AIService } from '../services/aiService';
import { ScriptureApiService } from '../services/scriptureApiService';
import { getVersionById } from '../data/bibleVersions';
import VerseCard from '../components/VerseCard';

interface GeneratorPageProps {
  onMemorizeVerse: (verse: Verse) => void;
  settings: AppSettings;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onMemorizeVerse, settings }) => {
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
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        generateAIVerses();
      } else if (import.meta.env.VITE_SCRIPTURE_API_KEY) {
        generateScriptureApiVerses();
      } else {
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
      }
    }, 800);
  };

  const generateScriptureApiVerses = async () => {
    try {
      const [otVerse, ntVerse] = await Promise.all([
        ScriptureApiService.getRandomVerse(settings.preferredVersion, 'OT'),
        ScriptureApiService.getRandomVerse(settings.preferredVersion, 'NT')
      ]);
      
      if (otVerse && ntVerse) {
        const version = getVersionById(settings.preferredVersion);
        setCurrentVerses({
          oldTestament: { ...otVerse, version: version?.abbreviation },
          newTestament: { ...ntVerse, version: version?.abbreviation }
        });
      } else {
        // Fallback to static verses
        fallbackToStaticVerses();
      }
    } catch (error) {
      console.error('Scripture API failed:', error);
      fallbackToStaticVerses();
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIVerses = async () => {
    try {
      const version = getVersionById(settings.preferredVersion);
      const [otVerse, ntVerse] = await Promise.all([
        AIService.generateVerse(verseType, 'OT', version?.name),
        AIService.generateVerse(verseType, 'NT', version?.name)
      ]);
      
      setCurrentVerses({
        oldTestament: otVerse,
        newTestament: ntVerse
      });
    } catch (error) {
      // Fallback to static verses
      fallbackToStaticVerses();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackToStaticVerses = () => {
    const verses = verseType === 'commission' ? commissionVerses : helpVerses;
    const otVerses = verses.filter(v => v.testament === 'OT');
    const ntVerses = verses.filter(v => v.testament === 'NT');
    
    const version = getVersionById(settings.preferredVersion);
    setCurrentVerses({
      oldTestament: { ...otVerses[Math.floor(Math.random() * otVerses.length)], version: version?.abbreviation },
      newTestament: { ...ntVerses[Math.floor(Math.random() * ntVerses.length)], version: version?.abbreviation }
    });
  };

  const handleVerseTypeChange = (type: VerseType) => {
    setVerseType(type);
    const verses = type === 'commission' ? commissionVerses : helpVerses;
    const version = getVersionById(settings.preferredVersion);
    setCurrentVerses({
      oldTestament: { ...verses.find(v => v.testament === 'OT')!, version: version?.abbreviation },
      newTestament: { ...verses.find(v => v.testament === 'NT')!, version: version?.abbreviation }
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
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm font-medium text-gray-700">
              Version: {getVersionById(settings.preferredVersion)?.abbreviation || 'KJV'}
            </span>
          </div>
        </div>
        
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