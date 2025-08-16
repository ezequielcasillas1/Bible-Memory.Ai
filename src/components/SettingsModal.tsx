import React from 'react';
import { X } from 'lucide-react';
import { BibleVersion } from '../services/BibleAPI';
import { AppSettings } from '../types';

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

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
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
            <h2 className="text-xl font-bold">⚙️ Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
                <option 
                  key={version.id} 
                  value={version.id}
                  disabled={!version.available}
                >
                  {version.abbreviation} – {version.name} {!version.available ? '(Coming Soon)' : ''}
        </div>
        
        <div className="p-6 space-y-6">
          {/* Study Time Setting */}
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-red-50 text-red-700">
              Failed to load Bible versions. Please refresh the page.
              Study Time (seconds)
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
              Preferred Bible Version
            </label>
            {isLoadingVersions ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading Bible versions...
              </div>
            ) : availableBibleVersions.length > 0 ? (
              <select
                value={settings.preferredVersion}
                onChange={(e) => handleSettingChange('preferredVersion', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableBibleVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.abbreviation} – {version.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-yellow-50 text-yellow-700">
                No Bible versions available. Please check your internet connection.
              </div>
            )}
          </div>

          {/* Bible Memory Career Settings Placeholder */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">📚 Bible Memory Career Settings</h3>
            <p className="text-sm text-gray-600">
              Coming Soon - Customization options for your memorization journey will be added here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;