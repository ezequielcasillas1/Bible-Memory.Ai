import React, { useState, useEffect } from 'react';
import { Tab, Verse, UserStats } from './types';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SettingsModal from './components/SettingsModal';
import GeneratorPage from './pages/GeneratorPage';
import MemorizePage from './pages/MemorizePage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [studyTime, setStudyTime] = useState(10);
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1247,
    versesMemorized: 23,
    currentStreak: 7,
    longestStreak: 12,
    averageAccuracy: 84,
    totalPracticeTime: 0,
    achievements: [],
    weeklyGoal: 7,
    dailyGoal: 1
  });

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('bibleMemoryStats');
    const savedStudyTime = localStorage.getItem('studyTime');
    
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    if (savedStudyTime) {
      setStudyTime(parseInt(savedStudyTime));
    }
  }, []);

  // Save user data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bibleMemoryStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('studyTime', studyTime.toString());
  }, [studyTime]);

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
          <GeneratorPage onMemorizeVerse={handleMemorizeVerse} />
        )}
        
        {activeTab === 'memorize' && (
          <MemorizePage
            selectedVerse={selectedVerse}
            studyTime={studyTime}
            onComplete={handleMemorizationComplete}
            onBackToGenerator={handleBackToGenerator}
            userStats={userStats}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfilePage userStats={userStats} />
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        studyTime={studyTime}
        onStudyTimeChange={setStudyTime}
      />
    </div>
  );
};

export default App;