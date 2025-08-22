import React, { useState } from 'react';
import { X, Globe, BookOpen, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { TranslationService, SUPPORTED_LANGUAGES, TranslationResult } from '../services/translationService';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: {
    text: string;
    reference: string;
    version: string;
  };
}

const TranslationModal: React.FC<TranslationModalProps> = ({ isOpen, onClose, verse }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!selectedLanguage || !verse.text) return;

    setIsTranslating(true);
    setError('');
    setTranslationResult(null);

    try {
      const result = await TranslationService.translateVerse(
        verse.text,
        selectedLanguage,
        verse.version.toLowerCase(),
        verse.reference
      );
      setTranslationResult(result);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'romance_germanic': return 'text-blue-600 bg-blue-50';
      case 'asian_african': return 'text-green-600 bg-green-50';
      case 'missionary_global': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'romance_germanic': return '🏛️';
      case 'asian_african': return '🌏';
      case 'missionary_global': return '✝️';
      default: return '🌍';
    }
  };

  const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);
  const isRecommended = selectedLangInfo ? 
    TranslationService.isRecommendedPairing(verse.version.toLowerCase(), selectedLanguage) : false;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">🌍 Translate Scripture</h2>
                <p className="text-gray-600">Translate this verse into world languages</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Original Verse */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-purple-600 font-medium">{verse.reference}</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {verse.version}
              </span>
            </div>
            <p className="text-gray-700 italic leading-relaxed">"{verse.text}"</p>
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Target Language</h3>
          
          {/* Strategy Groups */}
          <div className="space-y-6">
            {/* Romance & Germanic Languages */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🏛️</span>
                <h4 className="font-medium text-gray-800">Romance & Germanic Languages</h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Best with KJV, ASV, Darby
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'romance_germanic').map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-gray-500">{lang.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asian & African Languages */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🌏</span>
                <h4 className="font-medium text-gray-800">Asian & African Languages</h4>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Best with BBE, OEB-US
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'asian_african').map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-gray-500">{lang.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Missionary/Global Languages */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">✝️</span>
                <h4 className="font-medium text-gray-800">Missionary & Global Languages</h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Best with WEBBE, OEB-US
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'missionary_global').map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-gray-500">{lang.code}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation Notice */}
          {selectedLangInfo && (
            <div className={`mt-4 p-4 rounded-lg border ${
              isRecommended 
                ? 'border-green-200 bg-green-50' 
                : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-start space-x-2">
                {isRecommended ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    isRecommended ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {isRecommended ? 'Optimal Pairing' : 'Consider Alternative'}
                  </p>
                  <p className={`text-sm ${
                    isRecommended ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {isRecommended 
                      ? `${verse.version} is recommended for ${selectedLangInfo.name} translations`
                      : `For better accuracy in ${selectedLangInfo.name}, consider using: ${selectedLangInfo.recommended.map(v => v.toUpperCase()).join(', ')}`
                    }
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{selectedLangInfo.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Translate Button */}
          <div className="mt-6">
            <button
              onClick={handleTranslate}
              disabled={!selectedLanguage || isTranslating}
              className="w-full button-primary disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Translate Verse</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Translation Result */}
          {translationResult && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Translation Result</h3>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getStrategyIcon(translationResult.strategy)}</span>
                  <span className="font-medium text-gray-800">{translationResult.targetLanguage}</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    from {translationResult.sourceVersion}
                  </span>
                  {translationResult.isRecommendedPairing && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✓ Recommended
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-3">
                  "{translationResult.translatedText}"
                </p>
                {translationResult.reference && (
                  <p className="text-purple-600 font-medium">{translationResult.reference}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Translation Notes</h4>
                <p className="text-sm text-gray-600 mb-2">{translationResult.recommendation}</p>
                <p className="text-xs text-gray-500">{translationResult.strategyNote}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;