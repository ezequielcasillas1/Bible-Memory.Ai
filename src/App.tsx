import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab, Verse, UserStats, AppSettings } from './types';
import { getBibleVersions, BibleVersion } from './services/BibleAPI';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SettingsModal from './components/SettingsModal';
import GeneratorPage from './pages/GeneratorPage';
import MemorizePage from './pages/MemorizePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';

const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [availableBibleVersions, setAvailableBibleVersions] = useState<BibleVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  
  const [settings, setSettings] = useState<AppSettings>({
    studyTime: 10,
    preferredVersion: '', // Will be set once versions are loaded
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
    preferredVersion: '' // Will be set once versions are loaded
  });

  // Load Bible versions from API on mount
  useEffect(() => {
    const loadBibleVersions = async () => {
      setIsLoadingVersions(true);
      try {
        const versions = await getBibleVersions();
        console.log('Loaded Bible versions:', versions); // Debug log
        setAvailableBibleVersions(versions);
        
        // Set default version to first available version (KJV)
        const availableVersions = versions.filter(v => v.available);
        if (availableVersions.length > 0 && !settings.preferredVersion) {
          const defaultVersion = availableVersions[0].id;
          setSettings(prev => ({ ...prev, preferredVersion: defaultVersion }));
          setUserStats(prev => ({ ...prev, preferredVersion: defaultVersion }));
        }
      } catch (error) {
        console.error('Failed to load Bible versions:', error);
        // Fallback to basic versions if API fails
        const fallbackVersions: BibleVersion[] = [
          { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', available: true, source: 'bible-api' },
          { id: 'asv', name: 'American Standard Version', abbreviation: 'ASV', available: true, source: 'bible-api' },
          { id: 'nkjv', name: 'New King James Version', abbreviation: 'NKJV', available: false, source: 'bible-api' },
          { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', available: false, source: 'bible-api' },
          { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', available: false, source: 'bible-api' }
        ];
        console.log('Using fallback versions:', fallbackVersions); // Debug log
        setAvailableBibleVersions(fallbackVersions);
        const availableFallback = fallbackVersions.filter(v => v.available);
        if (availableFallback.length > 0 && !settings.preferredVersion) {
          setSettings(prev => ({ ...prev, preferredVersion: availableFallback[0].id }));
          setUserStats(prev => ({ ...prev, preferredVersion: availableFallback[0].id }));
        }
      } finally {
        setIsLoadingVersions(false);
      }
    };

    loadBibleVersions();
  }, [settings.preferredVersion]);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('bibleMemoryStats');
    const savedSettings = localStorage.getItem('bibleMemorySettings');
    
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
    }
  }, []);

  // Validate saved preferred version when Bible versions are loaded
  useEffect(() => {
    if (availableBibleVersions.length > 0 && settings.preferredVersion) {
      const availableVersions = availableBibleVersions.filter(v => v.available);
      const isValidVersion = availableVersions.some(v => v.id === settings.preferredVersion);
      if (!isValidVersion && availableVersions.length > 0) {
        // Reset to first available version if saved version is invalid or unavailable
        setSettings(prev => ({ ...prev, preferredVersion: availableVersions[0].id }));
      }
    }
  }, [availableBibleVersions, settings.preferredVersion]);

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

  const handleSignOut = async () => {
    await signOut();
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header 
        totalPoints={userStats.totalPoints} 
        onSettingsClick={() => setShowSettings(true)}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />
      
      {user ? (
        <>
          <Navigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          <main className="max-w-6xl mx-auto px-4 py-8">
            {activeTab === 'generator' && (
              <GeneratorPage 
                onMemorizeVerse={handleMemorizeVerse} 
                settings={settings}
                availableBibleVersions={availableBibleVersions}
              />
            )}
            
            {activeTab === 'memorize' && (
              <MemorizePage
                selectedVerse={selectedVerse}
                studyTime={settings.studyTime}
                onComplete={handleMemorizationComplete}
                onBackToGenerator={handleBackToGenerator}
                userStats={userStats}
                availableBibleVersions={availableBibleVersions}
              />
            )}
            
            {activeTab === 'search' && (
              <SearchPage 
                settings={settings}
                onMemorizeVerse={handleMemorizeVerse}
                availableBibleVersions={availableBibleVersions}
              />
            )}
            
            {activeTab === 'favorites' && (
              <FavoritesPage 
                settings={settings}
                onMemorizeVerse={handleMemorizeVerse}
                availableBibleVersions={availableBibleVersions}
              />
            )}
            
            {activeTab === 'history' && (
              <HistoryPage 
                settings={settings}
                userStats={userStats}
                onMemorizeVerse={handleMemorizeVerse}
                availableBibleVersions={availableBibleVersions}
              />
            )}
            
            {activeTab === 'profile' && (
              <ProfilePage 
                userStats={userStats}
                availableBibleVersions={availableBibleVersions}
              />
            )}
          </main>
        </>
      ) : (
        <LandingPage onAuthClick={() => setShowAuthModal(true)} />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        availableBibleVersions={availableBibleVersions}
        isLoadingVersions={isLoadingVersions}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;