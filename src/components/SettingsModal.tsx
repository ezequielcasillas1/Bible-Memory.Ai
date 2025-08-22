import React from 'react';
import { X } from 'lucide-react';
import { BibleVersion } from '../services/BibleAPI';
import { AppSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/translationService';
import { useLanguage, UI_LANGUAGES } from '../contexts/LanguageContext';

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
  const { t, setLanguage } = useLanguage();

  if (!isOpen) return null;

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