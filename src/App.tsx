import React, { useState, useEffect } from 'react';
import { Tab, Verse, UserStats, AppSettings } from './types';
import { bibleVersions } from './data/bibleVersions';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SettingsModal from './components/SettingsModal';
import GeneratorPage from './pages/GeneratorPage';
import MemorizePage from './pages/MemorizePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    studyTime: 10,
    preferredVersion: bibleVersions[0].id, // Default to KJV
  });
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1247,
    versesMemorized: 23,
    currentStreak: 7,
    longestStreak: 12,
    averageAccuracy: 84,
    totalPracticeTime: 0,
    achievements: [],
    weeklyGoal: 7,
    dailyGoal: 1,
    preferredVersion: bibleVersions[0].id
  });

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('bibleMemoryStats');
    const savedSettings = localStorage.getItem('bibleMemorySettings');
    
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save user data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bibleMemoryStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('bibleMemorySettings', JSON.stringify(settings));
  }, [settings]);

  // Sync preferred version between settings and user stats
  useEffect(() => {
    if (settings.preferredVersion !== userStats.preferredVersion) {
      setUserStats(prev => ({
        ...prev,
        preferredVersion: settings.preferredVersion
      }));
    }
  }, [settings.preferredVersion, userStats.preferredVersion]);

  const handleMemorizeVerse = (verse: Verse) => {
    setSelectedVerse(verse);
    setActiveTab('memorize');
  };

  const handleMemorizationComplete = (points: number) => {
    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + points,
      versesMemorized: prev.versesMemorized + 1,
      averageAccuracy: (prev.averageAccuracy * prev.versesMemorized + points / 1.5) / (prev.versesMemorized + 1)
    }));
  };

  const handleBackToGenerator = () => {
    setSelectedVerse(null);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header 
        totalPoints={userStats.totalPoints} 
        onSettingsClick={() => setShowSettings(true)} 
      />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'generator' && (
          <GeneratorPage onMemorizeVerse={handleMemorizeVerse} settings={settings} />
        )}
        
        {activeTab === 'memorize' && (
          <MemorizePage
            selectedVerse={selectedVerse}
            studyTime={settings.studyTime}
            onComplete={handleMemorizationComplete}
            onBackToGenerator={handleBackToGenerator}
            userStats={userStats}
          />
        )}
        
        {activeTab === 'search' && (
          <SearchPage 
            settings={settings}
            onMemorizeVerse={handleMemorizeVerse}
          />
        )}
        
        {activeTab === 'favorites' && (
          <FavoritesPage 
            settings={settings}
            onMemorizeVerse={handleMemorizeVerse}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryPage 
            settings={settings}
            userStats={userStats}
            onMemorizeVerse={handleMemorizeVerse}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfilePage userStats={userStats} />
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
};

export default App;