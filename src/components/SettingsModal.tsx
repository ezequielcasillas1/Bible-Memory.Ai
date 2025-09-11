import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BibleVersion } from '../services/BibleAPI';
import { AppSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/translationService';
import { useLanguage, UI_LANGUAGES } from '../contexts/LanguageContext';
import { UITranslationService } from '../services/uiTranslationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  availableBibleVersions: BibleVersion[];
  isLoadingVersions: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings,
  onSettingsChange,
  availableBibleVersions,
  isLoadingVersions
}) => {
  const { t, setLanguage, isTranslating, translationError } = useLanguage();

  // Difficulty info popup state
  const [showDifficultyInfo, setShowDifficultyInfo] = useState<number | null>(null);

  // Test API state
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  // Helper functions for difficulty info
  const getDifficultyName = (level: number): string => {
    const names: Record<number, string> = {
      2: 'Beginner', 4: 'Novice', 6: 'Elementary', 8: 'Intermediate', 
      10: 'Advanced', 15: 'Expert', 20: 'Master', 30: 'Virtuoso', 45: 'Legendary'
    };
    return names[level] || 'Standard';
  };

  const getDifficultyDescription = (level: number): string => {
    const descriptions: Record<number, string> = {
      2: 'Perfect for starting your memorization journey with very short verses',
      4: 'Building confidence with simple verses and basic truths',
      6: 'Standard difficulty for common memory verses like John 3:16',
      8: 'Moderate challenge for growing memorizers with longer promises',
      10: 'Solid challenge for dedicated students with complex passages',
      15: 'Significant challenge requiring dedication with extended passages',
      20: 'High difficulty for serious memorizers with long psalms',
      30: 'Extreme challenge for memory athletes with very long passages',
      45: 'Ultimate challenge - longest verses in Scripture like Esther 8:9'
    };
    return descriptions[level] || 'Standard difficulty level';
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    // Handle UI language change
    if (key === 'uiLanguage') {
      setLanguage(value);
    }
    
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  // Test Translation API function
  const testTranslationAPI = async () => {
    setIsTestingAPI(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing Translation API...');
      
      // Test with simple text that should work - testing Chinese specifically
      const testTexts = ['Hello', 'Settings', 'Test'];
      const targetLanguage = 'zh-cn'; // Chinese (Simplified)
      
      console.log('Test data:', { testTexts, targetLanguage });
      
      const result = await UITranslationService.translateUITexts(testTexts, targetLanguage);
      
      console.log('API Response:', result);
      
      if (result && result.translations && result.translations.length > 0) {
        setTestResult({
          success: true,
          message: `Successfully translated ${result.translations.length} texts to Chinese (${targetLanguage})`,
          details: {
            input: testTexts,
            output: result.translations,
            targetLanguage,
            source: result.source,
            fallback: result.fallback
          }
        });
      } else {
        setTestResult({
          success: false,
          message: 'API returned empty result',
          details: { result }
        });
      }
    } catch (error: any) {
      console.error('Translation API test failed:', error);
      setTestResult({
        success: false,
        message: `API Error: ${error.message || 'Unknown error'}`,
        details: {
          error: error.toString(),
          stack: error.stack,
          name: error.name
        }
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="settings-modal bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">⚙️ {t('settings.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Study Time Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.studyTime')}
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.studyTime}
                onChange={(e) => handleSettingChange('studyTime', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>5s</span>
                <span className="font-medium text-purple-600">{settings.studyTime}s</span>
                <span>60s</span>
              </div>
            </div>
          </div>

          {/* Practice Rounds Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practice Rounds
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={settings.maxRounds || 3}
                onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>1 round</span>
                <span className="font-medium text-purple-600">{settings.maxRounds || 3} rounds</span>
                <span>5 rounds</span>
              </div>
            </div>
          </div>

          {/* Fill-in-Blank Numerical Difficulty Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Fill-in-Blank Difficulty Scale
            </label>
            <div className="space-y-4">
              {/* Difficulty Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[2, 4, 6, 8, 10, 15, 20, 30, 45].map((difficulty) => {
                  const isSelected = (settings.fillInBlankDifficulty || 6) === difficulty;
                  const getDifficultyInfo = (level: number) => {
                    switch (level) {
                      case 2: return { emoji: '🌱', name: 'Beginner', color: 'green' };
                      case 4: return { emoji: '🌿', name: 'Novice', color: 'green' };
                      case 6: return { emoji: '🌳', name: 'Elementary', color: 'blue' };
                      case 8: return { emoji: '🌲', name: 'Intermediate', color: 'blue' };
                      case 10: return { emoji: '🏔️', name: 'Advanced', color: 'purple' };
                      case 15: return { emoji: '⛰️', name: 'Expert', color: 'purple' };
                      case 20: return { emoji: '🗻', name: 'Master', color: 'red' };
                      case 30: return { emoji: '🏔️', name: 'Virtuoso', color: 'red' };
                      case 45: return { emoji: '🌟', name: 'Legendary', color: 'yellow' };
                      default: return { emoji: '🌳', name: 'Standard', color: 'blue' };
                    }
                  };
                  const info = getDifficultyInfo(difficulty);
                  
                  return (
                    <button
                      key={difficulty}
                      onClick={() => handleSettingChange('fillInBlankDifficulty', difficulty)}
                      className={`relative p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm mb-1">{info.emoji}</div>
                        <div className="font-bold">{difficulty}</div>
                        <div className="text-xs opacity-75 truncate">{info.name}</div>
                      </div>
                      {/* Info Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDifficultyInfo(difficulty);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 transition-colors"
                        title={`Learn about difficulty level ${difficulty}`}
                      >
                        ?
                      </button>
                    </button>
                  );
                })}
              </div>
              
              {/* Current Selection Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Current: Level {settings.fillInBlankDifficulty || 6} - {getDifficultyName(settings.fillInBlankDifficulty || 6)}
                </div>
                <div className="text-xs text-blue-700">
                  {getDifficultyDescription(settings.fillInBlankDifficulty || 6)}
                </div>
              </div>
            </div>
          </div>

          {/* Bible Version Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.bibleVersion')}
            </label>
            {isLoadingVersions ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading Bible versions...
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  value={settings.preferredVersion}
                  onChange={(e) => handleSettingChange('preferredVersion', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {availableBibleVersions.length > 0 ? (
                    availableBibleVersions.map((version) => (
                      <option key={version.id} value={version.id} disabled={!version.available}>
                        {version.abbreviation} – {version.name} {!version.available ? '(Coming Soon)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">No versions available</option>
                  )}
                </select>
                
                {/* Version Info */}
                {availableBibleVersions.length > 0 && settings.preferredVersion && (
                  (() => {
                    const selectedVersion = availableBibleVersions.find(v => v.id === settings.preferredVersion);
                    if (selectedVersion && selectedVersion.available) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm">
                            <p className="font-medium text-blue-800 mb-1">
                              {selectedVersion.name} ({selectedVersion.abbreviation})
                            </p>
                            {selectedVersion.description && (
                              <p className="text-blue-700 mb-2">{selectedVersion.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600">
                                Source: {selectedVersion.source === 'bible-api' ? 'Bible API' : 'Wldeh API'}
                              </span>
                              {selectedVersion.license && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {selectedVersion.license}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            )}
          </div>

          {/* UI Language Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.uiLanguage')}
            </label>
            <div className="space-y-4">
              <select
                value={settings.uiLanguage}
                onChange={(e) => handleSettingChange('uiLanguage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {UI_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.flag} {language.name} ({language.nativeName})
                  </option>
                ))}
              </select>
              
              {/* Language Info */}
              {settings.uiLanguage && (
                (() => {
                  const selectedUILanguage = UI_LANGUAGES.find(lang => lang.code === settings.uiLanguage);
                  if (selectedUILanguage) {
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm">
                          <p className="font-medium text-blue-800 mb-1">
                            {selectedUILanguage.flag} {selectedUILanguage.name}
                          </p>
                          <p className="text-blue-700 mb-2">
                            Interface will be displayed in {selectedUILanguage.nativeName}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600">
                              Changes apply immediately
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              UI Language
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
            
            {/* Translation Status */}
            {isTranslating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700">Loading UI translations...</span>
                </div>
              </div>
            )}
            
            {translationError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-sm text-yellow-700">{translationError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Translation Test Button */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">🧪 Translation API Test (Chinese)</h4>
            <button
              onClick={testTranslationAPI}
              disabled={isTestingAPI}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isTestingAPI ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Testing API...</span>
                </div>
                              ) : (
                  'Test Chinese Translation'
                )}
            </button>
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="font-medium mb-1">
                  {testResult.success ? '✅ API Working' : '❌ API Failed'}
                </div>
                <div className="text-xs opacity-75">
                  {testResult.message}
                </div>
                {testResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs opacity-60">Show Details</summary>
                    <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Translation Language Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.translationLanguage')}
            </label>
            <div className="space-y-4">
              <select
                value={settings.preferredTranslationLanguage}
                onChange={(e) => handleSettingChange('preferredTranslationLanguage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Language</option>
                
                <optgroup label="🏛️ Romance & Germanic (Best with KJV, ASV, Darby)">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'romance_germanic').map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </optgroup>
                
                <optgroup label="🌏 Asian & African (Best with BBE, OEB-US)">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'asian_african').map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </optgroup>
                
                <optgroup label="✝️ Missionary & Global (Best with WEBBE, OEB-US)">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'missionary_global').map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </optgroup>
              </select>
              
              {/* Language Info */}
              {settings.preferredTranslationLanguage && (
                (() => {
                  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === settings.preferredTranslationLanguage);
                  if (selectedLanguage) {
                    const isRecommended = selectedLanguage.recommended.includes(settings.preferredVersion);
                    return (
                      <div className={`border rounded-lg p-3 ${
                        isRecommended 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="text-sm">
                          <p className={`font-medium mb-1 ${
                            isRecommended ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            {selectedLanguage.name} ({selectedLanguage.code.toUpperCase()})
                          </p>
                          <p className={`mb-2 ${
                            isRecommended ? 'text-green-700' : 'text-yellow-700'
                          }`}>
                            {selectedLanguage.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                              selectedLanguage.strategy === 'romance_germanic' ? 'bg-blue-100 text-blue-700' :
                              selectedLanguage.strategy === 'asian_african' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {selectedLanguage.strategy === 'romance_germanic' ? '🏛️ Romance/Germanic' :
                               selectedLanguage.strategy === 'asian_african' ? '🌏 Asian/African' :
                               '✝️ Missionary/Global'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isRecommended ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isRecommended ? '✓ Optimal Pairing' : 'Consider Alternative'}
                            </span>
                          </div>
                          {!isRecommended && (
                            <p className="text-xs text-yellow-600 mt-2">
                              Recommended versions: {selectedLanguage.recommended.map(v => v.toUpperCase()).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('settings.cancel')}
          </button>
        </div>
      </div>

      {/* Difficulty Info Popup */}
      {showDifficultyInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Difficulty Level {showDifficultyInfo}
                </h3>
                <button
                  onClick={() => setShowDifficultyInfo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              {(() => {
                const { NumericalDifficultyAPI } = require('../services/numericalDifficultyAPI');
                const level = NumericalDifficultyAPI.getDifficultyLevel(showDifficultyInfo);
                
                if (!level) return <div>Invalid difficulty level</div>;
                
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{level.emoji}</div>
                      <h4 className="text-xl font-bold text-gray-900">{level.name}</h4>
                      <p className="text-gray-600">{level.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">📊 Specifications</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>Words to blank:</strong> {level.value}</li>
                        <li><strong>Word count range:</strong> {level.wordCountRange}</li>
                        <li><strong>Target audience:</strong> {level.targetAudience}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">📖 Recommended Verses</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {level.recommendedVerses.map((verse: string, index: number) => (
                          <li key={index}>• {verse}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-2">✨ Example Verses</h5>
                      <ul className="text-sm text-green-800 space-y-1">
                        {level.exampleVerses.map((example: string, index: number) => (
                          <li key={index}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDifficultyInfo(null)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;