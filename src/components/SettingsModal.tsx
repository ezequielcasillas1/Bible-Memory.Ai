import React from 'react';
import { X } from 'lucide-react';
import { BibleVersion } from '../services/BibleAPI';
import { AppSettings } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supportedLanguages, TranslationService } from '../services/translationService';

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
  if (!isOpen) return null;

  const { t, currentLanguage, currentBibleLanguage, changeLanguage, changeBibleLanguage } = useTranslation();

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    handleSettingChange('uiLanguage', languageCode);
  };

  const handleBibleLanguageChange = (languageCode: string) => {
    changeBibleLanguage(languageCode);
    handleSettingChange('bibleLanguage', languageCode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="settings-modal bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">⚙️ {t('settings.title', 'Settings')}</h2>
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
              {t('settings.studyTime', 'Study Time (seconds)')}
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

          {/* UI Language Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.uiLanguage', 'Interface Language')}
            </label>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {supportedLanguages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.name} ({language.nativeName})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Changes the language of buttons, menus, and interface text
            </p>
          </div>

          {/* Bible Language Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.bibleLanguage', 'Bible Language')}
            </label>
            <select
              value={currentBibleLanguage}
              onChange={(e) => handleBibleLanguageChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {TranslationService.getAvailableBibleLanguages().map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.name} ({language.nativeName})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Changes the language for Bible verses and content
            </p>
            
            {/* Show available Bible translations for selected language */}
            {currentBibleLanguage !== 'en' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Available Bible Translations:
                </h4>
                <div className="space-y-1">
                  {TranslationService.getBibleTranslationsForLanguage(currentBibleLanguage).map((translation, index) => (
                    <div key={index} className="text-xs text-blue-700">
                      • {translation.abbreviation} - {translation.name}
                    </div>
                  ))}
                  {TranslationService.getBibleTranslationsForLanguage(currentBibleLanguage).length === 0 && (
                    <div className="text-xs text-blue-700">
                      • Automatic translation from English versions
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bible Version Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.bibleVersion', 'Preferred Bible Version')}
            </label>
            {isLoadingVersions ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                {t('common.loading', 'Loading...')} Bible versions...
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

          {/* Bible Memory Career Settings Placeholder */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">📚 Advanced Settings</h3>
            <p className="text-sm text-gray-600">
              More customization options for your memorization journey will be added here
            </p>
          </div>
          
          {/* Version Statistics */}
          {availableBibleVersions.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <h3 className="font-medium text-gray-800 mb-2">📊 Bible Version Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">
                    {availableBibleVersions.filter(v => v.available).length}
                  </span>
                  <span className="text-gray-600 ml-1">Available Now</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-600">
                    {availableBibleVersions.filter(v => !v.available).length}
                  </span>
                  <span className="text-gray-600 ml-1">Coming Soon</span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">
                    {availableBibleVersions.filter(v => v.license === 'Public Domain').length}
                  </span>
                  <span className="text-gray-600 ml-1">Public Domain</span>
                </div>
                <div>
                  <span className="font-medium text-purple-600">
                    {availableBibleVersions.filter(v => v.source === 'bible-api').length}
                  </span>
                  <span className="text-gray-600 ml-1">Bible API</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-purple-200">
                <h4 className="font-medium text-gray-800 mb-2">🌍 Language Support</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-600">
                      {supportedLanguages.length}
                    </span>
                    <span className="text-gray-600 ml-1">Languages</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">
                      {TranslationService.getPopularLanguages().length}
                    </span>
                    <span className="text-gray-600 ml-1">Popular</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;