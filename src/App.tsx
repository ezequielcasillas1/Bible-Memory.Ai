import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Settings, 
  Trophy, 
  MessageCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X,
  Star,
  Target,
  Calendar,
  Zap,
  Award,
  TrendingUp,
  Clock,
  Brain,
  Heart,
  Shield,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Lightbulb,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
  Home,
  Book,
  User,
  Bell
} from 'lucide-react';
import { OpenAIService, type VerseResponse, type ImprovementSuggestion } from './services/openai';
import { fetchEnglishBiblesByAbbrev, searchPassageByQuery, type ApiBibleSummary } from './services/apiBible';

// Types
interface Verse {
  id: string;
  text: string;
  reference: string;
  testament: 'OT' | 'NT';
  reason?: string;
}

interface UserStats {
  totalPoints: number;
  versesMemorized: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalPracticeTime: number;
  achievements: Achievement[];
  weeklyGoal: number;
  dailyGoal: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface MemorizationSession {
  verse: Verse;
  startTime: Date;
  attempts: number;
  completed: boolean;
  accuracy: number;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type Tab = 'home' | 'memorize' | 'bible' | 'progress' | 'chat';
type VerseType = 'commission' | 'help';

const App: React.FC = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [verseType, setVerseType] = useState<VerseType>('commission');
  const [verses, setVerses] = useState<{ oldTestament: Verse | null; newTestament: Verse | null; connection: string }>({
    oldTestament: null,
    newTestament: null,
    connection: ''
  });
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bible versions state
  const [supportedBibles, setSupportedBibles] = useState<ApiBibleSummary[]>([]);
  const [selectedBibleVersion, setSelectedBibleVersion] = useState('ESV');

  // Memorization state
  const [userInput, setUserInput] = useState('');
  const [showVerse, setShowVerse] = useState(false);
  const [currentSession, setCurrentSession] = useState<MemorizationSession | null>(null);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [memorizationTimer, setMemorizationTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // User stats and progress
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    versesMemorized: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageAccuracy: 0,
    totalPracticeTime: 0,
    achievements: [],
    weeklyGoal: 7,
    dailyGoal: 1
  });

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    autoPlay: true,
    soundEnabled: true,
    darkMode: false,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    dailyReminder: true,
    showHints: true
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Bible reading state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Load supported Bible versions
  useEffect(() => {
    const loadBibleVersions = async () => {
      try {
        const supportedVersions = ['KJV', 'NKJV', 'NLT', 'ESV', 'ASV'];
        const bibles = await fetchEnglishBiblesByAbbrev(supportedVersions);
        setSupportedBibles(bibles);
      } catch (error) {
        console.error('Failed to load API.Bible versions:', error);
        setError('Failed to load Bible versions');
      }
    };

    loadBibleVersions();
  }, []);

  // Generate initial verses when component mounts or verse type changes
  useEffect(() => {
    generateNewVerses();
  }, [verseType, selectedBibleVersion]);

  // Timer effect for memorization sessions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMemorizing && !isPaused) {
      interval = setInterval(() => {
        setMemorizationTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMemorizing, isPaused]);

  const generateNewVerses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: VerseResponse = await OpenAIService.generateVerses(verseType, selectedBibleVersion);
      
      const oldTestamentVerse: Verse = {
        id: Date.now().toString() + '_ot',
        text: response.oldTestament.text,
        reference: response.oldTestament.reference,
        testament: 'OT',
        reason: response.oldTestament.reason
      };

      const newTestamentVerse: Verse = {
        id: Date.now().toString() + '_nt',
        text: response.newTestament.text,
        reference: response.newTestament.reference,
        testament: 'NT',
        reason: response.newTestament.reason
      };
      
      setVerses({
        oldTestament: oldTestamentVerse,
        newTestament: newTestamentVerse,
        connection: response.connection
      });
    } catch (error) {
      console.error('Error generating verses:', error);
      setError('Failed to generate verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectVerse = (verse: Verse) => {
    setSelectedVerse(verse);
    setActiveTab('memorize');
  };

  const startMemorization = () => {
    if (!selectedVerse) return;
    
    setCurrentSession({
      verse: selectedVerse,
      startTime: new Date(),
      attempts: 0,
      completed: false,
      accuracy: 0
    });
    setIsMemorizing(true);
    setMemorizationTimer(0);
    setIsPaused(false);
    setUserInput('');
    setShowVerse(false);
  };

  const checkMemorization = async () => {
    if (!currentSession) return;

    const accuracy = await OpenAIService.analyzeMemorizationAccuracy(
      userInput,
      currentSession.verse.text
    );

    const updatedSession = {
      ...currentSession,
      attempts: currentSession.attempts + 1,
      accuracy: accuracy.accuracy,
      completed: accuracy.accuracy >= 80
    };

    setCurrentSession(updatedSession);

    if (updatedSession.completed) {
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + Math.round(accuracy.accuracy),
        versesMemorized: prev.versesMemorized + 1,
        totalPracticeTime: prev.totalPracticeTime + memorizationTimer,
        averageAccuracy: (prev.averageAccuracy * prev.versesMemorized + accuracy.accuracy) / (prev.versesMemorized + 1)
      }));

      setIsMemorizing(false);
      setCurrentSession(null);
    }
  };

  const searchBible = async () => {
    if (!searchQuery.trim() || !selectedBibleVersion) return;
    
    setIsLoading(true);
    try {
      const bible = supportedBibles.find(b => b.abbreviation === selectedBibleVersion);
      if (!bible) throw new Error('Bible version not found');
      
      const result = await searchPassageByQuery(bible.id, searchQuery);
      setSearchResults([result]);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search Bible');
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await OpenAIService.chatResponse(chatInput);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bible Memory AI
                </h1>
                <p className="text-sm text-gray-600">Memorize Scripture with AI assistance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-sm">{userStats.totalPoints}</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/60 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'memorize', label: 'Memorize', icon: Brain },
              { id: 'bible', label: 'Bible', icon: Book },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'chat', label: 'AI Coach', icon: MessageCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`nav-tab flex items-center space-x-2 px-6 py-3 rounded-t-lg font-medium transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-white/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4 inline" />
            </button>
          </div>
        )}

        {/* Home Tab - Original UI */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Main Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Receive Today's Commission or Help People Verses
              </h1>
              
              {/* Verse Type Tabs */}
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  onClick={() => setVerseType('commission')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    verseType === 'commission'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  Commission Verses
                </button>
                <button
                  onClick={() => setVerseType('help')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    verseType === 'help'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-purple-600'
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Old Testament Verse */}
                {verses.oldTestament && (
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Old Testament</h3>
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                        OT
                      </span>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-lg leading-relaxed text-gray-700 mb-4 italic">
                        "{verses.oldTestament.text}"
                      </p>
                      <p className="text-purple-600 font-medium">
                        {verses.oldTestament.reference}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => selectVerse(verses.oldTestament!)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      Memorize This Verse
                    </button>
                  </div>
                )}

                {/* New Testament Verse */}
                {verses.newTestament && (
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">New Testament</h3>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        NT
                      </span>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-lg leading-relaxed text-gray-700 mb-4 italic">
                        "{verses.newTestament.text}"
                      </p>
                      <p className="text-purple-600 font-medium">
                        {verses.newTestament.reference}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => selectVerse(verses.newTestament!)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      Memorize This Verse
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Connection Insight */}
            {verses.connection && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
                <div className="flex items-center mb-4">
                  <Heart className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-bold text-gray-800">Connection Insight</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {verses.connection}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={generateNewVerses}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Generate New Verses</span>
              </button>
              
              <button
                onClick={() => setActiveTab('memorize')}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all"
              >
                <span>Go to Memorize</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Memorize Tab */}
        {activeTab === 'memorize' && (
          <div className="space-y-8">
            {selectedVerse ? (
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Choose a Verse to Memorize</h2>
                  <p className="text-gray-600">Practice reciting your selected verse</p>
                </div>

                {/* Selected Verse Display */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
                  <p className="text-lg leading-relaxed text-gray-700 mb-4 italic text-center">
                    "{selectedVerse.text}"
                  </p>
                  <p className="text-purple-600 font-medium text-center">
                    {selectedVerse.reference}
                  </p>
                </div>

                {/* Memorization Interface */}
                {!isMemorizing ? (
                  <div className="text-center">
                    <button
                      onClick={startMemorization}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:shadow-lg transition-all"
                    >
                      Start Memorizing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          {formatTime(memorizationTimer)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setShowVerse(!showVerse)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {showVerse ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{showVerse ? 'Hide' : 'Show'} Verse</span>
                      </button>
                    </div>

                    {showVerse && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                        <p className="text-lg leading-relaxed text-gray-700 italic text-center">
                          "{selectedVerse.text}"
                        </p>
                      </div>
                    )}

                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type the verse from memory..."
                      className="w-full p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                    
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={checkMemorization}
                        disabled={!userInput.trim()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        Check Answer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Verse Selected</h3>
                <p className="text-gray-500 mb-6">Choose a verse from the Home tab to start memorizing</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Go to Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bible Tab */}
        {activeTab === 'bible' && (
          <div className="space-y-6">
            {/* Bible Search */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-purple-600" />
                Bible Search
              </h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for verses (e.g., 'John 3:16' or 'love')"
                    className="w-full p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && searchBible()}
                  />
                </div>
                
                <select
                  value={selectedBibleVersion}
                  onChange={(e) => setSelectedBibleVersion(e.target.value)}
                  className="p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {supportedBibles.map((bible) => (
                    <option key={bible.id} value={bible.abbreviation}>
                      {bible.abbreviation} - {bible.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={searchBible}
                  disabled={isLoading || !searchQuery.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
                <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                {searchResults.map((result, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                    <p className="text-lg leading-relaxed text-gray-800">
                      "{result.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Points', value: userStats.totalPoints, icon: Trophy, color: 'yellow' },
                { label: 'Verses Memorized', value: userStats.versesMemorized, icon: BookOpen, color: 'blue' },
                { label: 'Current Streak', value: `${userStats.currentStreak} days`, icon: Flame, color: 'orange' },
                { label: 'Average Accuracy', value: `${Math.round(userStats.averageAccuracy)}%`, icon: Target, color: 'green' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{label}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${color}-100`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Weekly Progress
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Goal: {userStats.weeklyGoal} verses</span>
                  <span className="text-sm font-medium">{userStats.versesMemorized} / {userStats.weeklyGoal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (userStats.versesMemorized / userStats.weeklyGoal) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-200 h-96 flex flex-col">
            <div className="p-6 border-b border-purple-200">
              <h2 className="text-xl font-bold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                AI Memory Coach
              </h2>
              <p className="text-sm text-gray-600">Get personalized advice and encouragement</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Ask me anything about Bible memorization!</p>
                </div>
              )}
              
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-purple-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about memorization techniques, motivation, etc..."
                  className="flex-1 p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Bible Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bible Version
                </label>
                <select
                  value={selectedBibleVersion}
                  onChange={(e) => setSelectedBibleVersion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {supportedBibles.map((bible) => (
                    <option key={bible.id} value={bible.abbreviation}>
                      {bible.abbreviation} - {bible.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Toggle Settings */}
              {[
                { key: 'autoPlay', label: 'Auto-play verses', icon: Play },
                { key: 'soundEnabled', label: 'Sound effects', icon: Volume2 },
                { key: 'darkMode', label: 'Dark mode', icon: Moon },
                { key: 'dailyReminder', label: 'Daily reminders', icon: Bell },
                { key: 'showHints', label: 'Show hints', icon: Lightbulb }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[key as keyof typeof settings] ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;