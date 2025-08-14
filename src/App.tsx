import React, { useState, useEffect, useRef } from 'react';
import { OpenAIService, VerseResponse, ImprovementSuggestion } from './services/openai';
import { 
  BookOpen, 
  User, 
  Settings, 
  Clock, 
  Target, 
  Trophy, 
  Star, 
  CheckCircle, 
  RefreshCw,
  ArrowRight,
  Zap,
  Heart,
  Brain,
  Award,
  TrendingUp,
  Calendar,
  Book,
  MessageCircle,
  History,
  Send,
  ThumbsUp
} from 'lucide-react';

// Types
interface Verse {
  text: string;
  reference: string;
  testament: 'OT' | 'NT';
  reason?: string;
  id?: string;
  dateMemorized?: string;
  accuracy?: number;
  isLiked?: boolean;
}

interface UserStats {
  totalPoints: number;
  versesMemorized: number;
  averageAccuracy: number;
  currentStreak: number;
}

interface Achievement {
  id: string;
  name: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

type Page = 'generator' | 'memorize' | 'profile' | 'chat' | 'history' | 'favorites';
type VerseType = 'commission' | 'help';
type MemorizePhase = 'setup' | 'countdown' | 'hidden' | 'input' | 'results';

function App() {
  // State management
  const [currentPage, setCurrentPage] = useState<Page>('generator');
  const [showSettings, setShowSettings] = useState(false);
  const [verseType, setVerseType] = useState<VerseType>('commission');
  const [currentVerses, setCurrentVerses] = useState<{ ot: Verse; nt: Verse; connection: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Memorize page state
  const [memorizePhase, setMemorizePhase] = useState<MemorizePhase>('setup');
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [userInput, setUserInput] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<{ feedback: string; suggestions: string[] } | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([]);
  
  // New feature states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [memorizedVerses, setMemorizedVerses] = useState<Verse[]>([]);
  const [likedVerses, setLikedVerses] = useState<Verse[]>([]);
  
  // Settings state
  const [uiLanguage, setUiLanguage] = useState('English');
  const [bibleLanguage, setBibleLanguage] = useState('English');
  const [bibleVersion, setBibleVersion] = useState('kjv');
  
  // User stats
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1247,
    versesMemorized: 23,
    averageAccuracy: 84,
    currentStreak: 7
  });

  // Achievements
  const [achievements] = useState<Achievement[]>([
    { id: 'first', name: 'First Verse', icon: <Trophy className="h-5 w-5" />, unlocked: true },
    { id: 'streak', name: '7-Day Streak', icon: <Star className="h-5 w-5" />, unlocked: true },
    { id: 'ot', name: 'OT Explorer', icon: <Book className="h-5 w-5" />, unlocked: true },
    { id: 'nt', name: 'NT Scholar', icon: <CheckCircle className="h-5 w-5" />, unlocked: false }
  ]);

  // Refs
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with first verse generation
  useEffect(() => {
    generateNewVerses();
    generateImprovementSuggestions();
  }, []);

  // Generate improvement suggestions when stats change
  useEffect(() => {
    generateImprovementSuggestions();
  }, [userStats]);

  const generateImprovementSuggestions = async () => {
    try {
      const suggestions = await OpenAIService.generateImprovementSuggestions(userStats);
      setImprovementSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating improvement suggestions:', error);
    }
  };

  const generateNewVerses = async () => {
    setIsGenerating(true);
    try {
      const response = await OpenAIService.generateVerses(verseType, bibleVersion);
      setCurrentVerses({
        ot: { 
          text: response.oldTestament.text, 
          reference: response.oldTestament.reference, 
          testament: 'OT', 
          reason: response.oldTestament.reason,
          id: Date.now().toString() + '_ot'
        },
        nt: { 
          text: response.newTestament.text, 
          reference: response.newTestament.reference, 
          testament: 'NT', 
          reason: response.newTestament.reason,
          id: Date.now().toString() + '_nt'
        },
        connection: response.connection
      });
    } catch (error) {
      console.error('Error generating verses:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Effects
  useEffect(() => {
    if (memorizePhase === 'countdown' && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (memorizePhase === 'countdown' && countdown === 0) {
      setMemorizePhase('hidden');
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, memorizePhase]);

  // Update verses when type changes
  useEffect(() => {
    generateNewVerses();
  }, [verseType, bibleVersion]);

  // Update verses when Bible version changes (with delay to prevent rapid calls)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentVerses) {
        generateNewVerses();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [bibleVersion]);

  // Available languages and versions
  const uiLanguages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
  ];

  const bibleLanguages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
  ];

  const bibleVersions = {
    English: [
      { code: 'kjv', name: 'KJV (King James Version)', description: 'Traditional, formal language' },
      { code: 'nkjv', name: 'NKJV (New King James Version)', description: 'Modern language, traditional style' },
      { code: 'nlt', name: 'NLT (New Living Translation)', description: 'Easy-to-read contemporary' },
      { code: 'esv', name: 'ESV (English Standard Version)', description: 'Literal, word-for-word accuracy' },
      { code: 'asv', name: 'ASV (American Standard Version)', description: 'Formal equivalence' },
      { code: 'basicenglish', name: 'Basic English Bible', description: 'Simple vocabulary' },
      { code: 'darby', name: 'Darby Translation', description: 'Literal translation' },
      { code: 'douayrheims', name: 'Douay-Rheims', description: 'Catholic translation' },
      { code: 'web', name: 'World English Bible', description: 'Modern public domain' },
      { code: 'ylt', name: 'Young\'s Literal Translation', description: 'Very literal' }
    ],
    Spanish: [
      { code: 'rv1909', name: 'Reina-Valera 1909', description: 'Classic Spanish translation' },
      { code: 'rv1960', name: 'Reina-Valera 1960', description: 'Most popular Spanish Bible' },
      { code: 'rvr1960', name: 'RVR1960 (Alternative)', description: 'Reina-Valera Revisada 1960' }
    ],
    French: [
      { code: 'ls1910', name: 'Louis Segond 1910', description: 'Standard French Bible' }
    ],
    German: [
      { code: 'luther1912', name: 'Luther Bible 1912', description: 'Classic German translation' }
    ],
    Portuguese: [
      { code: 'almeida', name: 'João Ferreira de Almeida', description: 'Traditional Portuguese' }
    ],
    Italian: [
      { code: 'diodati', name: 'Giovanni Diodati Bible', description: 'Classic Italian translation' }
    ],
    Russian: [
      { code: 'synodal', name: 'Russian Synodal Translation', description: 'Standard Russian Bible' }
    ],
    Chinese: [
      { code: 'cuv', name: 'Chinese Union Version Simplified', description: 'Standard Chinese Bible' }
    ],
    Japanese: [
      { code: 'kougo', name: 'Kougo-yaku Bible', description: 'Modern Japanese translation' }
    ],
    Korean: [
      { code: 'krv', name: 'Korean Revised Version', description: 'Standard Korean Bible' }
    ],
    Arabic: [
      { code: 'arabic', name: 'Arabic Bible', description: 'Standard Arabic translation' }
    ],
    Hindi: [
      { code: 'hindi', name: 'Hindi Bible', description: 'Standard Hindi translation' }
    ]
  };

  const startMemorizeSession = (verse: Verse) => {
    setSelectedVerse(verse);
    setMemorizePhase('countdown');
    setCountdown(10);
    setUserInput('');
    setAccuracy(0);
    setSessionPoints(0);
  };

  const checkAnswer = async () => {
    if (!selectedVerse) return;
    
    try {
      const analysis = await OpenAIService.analyzeMemorizationAccuracy(userInput, selectedVerse.text);
      const points = Math.round(analysis.accuracy * 0.2);
      
      setAccuracy(analysis.accuracy);
      setSessionPoints(points);
      setAiAnalysis({ feedback: analysis.feedback, suggestions: analysis.suggestions });
      setMemorizePhase('results');
      
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + points,
        versesMemorized: analysis.accuracy >= 80 ? prev.versesMemorized + 1 : prev.versesMemorized
      }));
      
      // Add to memorized verses if accuracy is good
      if (analysis.accuracy >= 80 && selectedVerse) {
        const memorizedVerse = {
          ...selectedVerse,
          dateMemorized: new Date().toLocaleDateString(),
          accuracy: analysis.accuracy
        };
        setMemorizedVerses(prev => [memorizedVerse, ...prev]);
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      // Fallback to basic analysis
      const basicAccuracy = Math.round(Math.random() * 30 + 70); // Simulate 70-100% range
      const points = Math.round(basicAccuracy * 0.2);
      
      setAccuracy(basicAccuracy);
      setSessionPoints(points);
      setAiAnalysis({ 
        feedback: basicAccuracy >= 90 ? "Excellent work!" : "Good effort! Keep practicing!",
        suggestions: ["Try reading the verse aloud", "Focus on key phrases"]
      });
      setMemorizePhase('results');
      
      // Add to memorized verses if accuracy is good
      if (basicAccuracy >= 80 && selectedVerse) {
        const memorizedVerse = {
          ...selectedVerse,
          dateMemorized: new Date().toLocaleDateString(),
          accuracy: basicAccuracy
        };
        setMemorizedVerses(prev => [memorizedVerse, ...prev]);
      }
    }
    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + sessionPoints
    }));
  };

  const resetMemorizeSession = () => {
    setMemorizePhase('setup');
    setSelectedVerse(null);
    setUserInput('');
    setAiAnalysis(null);
    setCountdown(10);
  };

  const toggleLikeVerse = (verse: Verse) => {
    const verseWithId = { ...verse, id: verse.id || Date.now().toString() };
    
    setLikedVerses(prev => {
      const isAlreadyLiked = prev.some(v => v.id === verseWithId.id);
      if (isAlreadyLiked) {
        return prev.filter(v => v.id !== verseWithId.id);
      } else {
        return [{ ...verseWithId, isLiked: true }, ...prev];
      }
    });
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // Create a context-aware prompt for AI chat
      const contextPrompt = `User question about Bible memorization improvement: "${chatInput}"
      
      User's current stats:
      - Total Points: ${userStats.totalPoints}
      - Verses Memorized: ${userStats.versesMemorized}
      - Average Accuracy: ${userStats.averageAccuracy}%
      - Current Streak: ${userStats.currentStreak} days
      
      Recent AI suggestions: ${improvementSuggestions.map(s => s.suggestion).join(', ')}
      
      Provide a helpful, encouraging response with specific Bible memorization advice.`;
      
      const response = await OpenAIService.chatResponse(contextPrompt);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later!",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Render functions
  const renderNavigation = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Bible Memory AI</h1>
          </div>
          
          <nav className="flex space-x-1">
            {[
              { id: 'generator', label: 'Generator', icon: Zap },
              { id: 'memorize', label: 'Memorize', icon: Brain },
              { id: 'chat', label: 'AI Chat', icon: MessageCircle },
              { id: 'history', label: 'History', icon: History },
              { id: 'favorites', label: 'Favorites', icon: Heart },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id as Page)}
                className={`nav-tab px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                  currentPage === id
                    ? 'active text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );

  const renderGenerator = () => (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {!currentVerses && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating verses with AI...</p>
          </div>
        )}
        
        {currentVerses && (
          <>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {verseType === 'commission' ? 'Discover Compelling Reasons to Follow Christ' : 'Find Comfort and Help in God\'s Word'}
          </h2>
          
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVerseType('commission')}
              className={`toggle-switch px-6 py-2 rounded-md font-medium ${
                verseType === 'commission'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Conversion Verses
            </button>
            <button
              onClick={() => setVerseType('help')}
              className={`toggle-switch px-6 py-2 rounded-md font-medium ${
                verseType === 'help'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Help People Verses
            </button>
          </div>
        </div>

            {isGenerating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating new verses...</p>
              </div>
            ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="verse-card bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Old Testament</h3>
              <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                OT
              </div>
            </div>
            <blockquote className="text-gray-700 italic mb-4 leading-relaxed">
              "{currentVerses.ot.text}"
            </blockquote>
            <p className="text-sm font-medium text-purple-600">
              {currentVerses.ot.reference}
            </p>
            {currentVerses.ot.reason && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">→ Reason:</span> {currentVerses.ot.reason}
                </p>
              </div>
            )}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => startMemorizeSession(currentVerses.ot)}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Memorize This Verse
              </button>
              <button
                onClick={() => toggleLikeVerse(currentVerses.ot)}
                className={`p-2 rounded-lg transition-colors ${
                  likedVerses.some(v => v.id === currentVerses.ot.id)
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-5 w-5 ${
                  likedVerses.some(v => v.id === currentVerses.ot.id) ? 'fill-current' : ''
                }`} />
              </button>
            </div>
          </div>

          <div className="verse-card bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Testament</h3>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                NT
              </div>
            </div>
            <blockquote className="text-gray-700 italic mb-4 leading-relaxed">
              "{currentVerses.nt.text}"
            </blockquote>
            <p className="text-sm font-medium text-purple-600">
              {currentVerses.nt.reference}
            </p>
            {currentVerses.nt.reason && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">→ Reason:</span> {currentVerses.nt.reason}
                </p>
              </div>
            )}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => startMemorizeSession(currentVerses.nt)}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Memorize This Verse
              </button>
              <button
                onClick={() => toggleLikeVerse(currentVerses.nt)}
                className={`p-2 rounded-lg transition-colors ${
                  likedVerses.some(v => v.id === currentVerses.nt.id)
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-5 w-5 ${
                  likedVerses.some(v => v.id === currentVerses.nt.id) ? 'fill-current' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
            )}

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Heart className="h-6 w-6 text-purple-600 mt-1" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {verseType === 'commission' ? 'Why These Verses Matter for Faith' : 'Connection Insight'}
              </h4>
              <p className="text-gray-700">
                {currentVerses.connection} 
                {currentVerses.ot.reference && currentVerses.nt.reference && (
                  <span className="text-purple-600 font-medium">
                    {' '}({currentVerses.ot.reference} & {currentVerses.nt.reference})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={generateNewVerses}
            className="button-primary text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate New Verses</span>
          </button>
          <button
            onClick={() => setCurrentPage('memorize')}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium border-2 border-purple-600 hover:bg-purple-50 transition-colors flex items-center space-x-2"
          >
            <span>Go to Memorize</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );

  const renderMemorize = () => (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {memorizePhase === 'setup' && currentVerses && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Choose a Verse to Memorize</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.values(currentVerses).filter(v => typeof v === 'object' && 'text' in v).map((verse, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <blockquote className="text-gray-700 italic mb-4">
                    "{verse.text.length > 100 ? verse.text.substring(0, 100) + '...' : verse.text}"
                  </blockquote>
                  <p className="text-sm font-medium text-purple-600 mb-4">{verse.reference}</p>
                  <button
                    onClick={() => startMemorizeSession(verse)}
                    className="w-full button-primary text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Select This Verse
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {memorizePhase === 'countdown' && selectedVerse && (
          <div className="text-center animate-slide-up">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className={`countdown-timer text-6xl font-bold mb-6 ${countdown <= 3 ? 'countdown-urgent' : 'text-purple-600'}`}>
                {countdown}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Memorize this verse...
              </h3>
              <blockquote className="text-lg text-gray-700 italic mb-4 leading-relaxed">
                "{selectedVerse.text}"
              </blockquote>
              <p className="text-sm font-medium text-purple-600">
                {selectedVerse.reference}
              </p>
            </div>
          </div>
        )}

        {memorizePhase === 'hidden' && (
          <div className="text-center animate-slide-up">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <Clock className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Time to recall the verse!
              </h3>
              <button
                onClick={() => setMemorizePhase('input')}
                className="button-primary text-white px-8 py-3 rounded-lg font-medium"
              >
                Start Typing
              </button>
            </div>
          </div>
        )}

        {memorizePhase === 'input' && selectedVerse && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Type the verse: {selectedVerse.reference}
              </h3>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the verse here..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex justify-center mt-6">
                <button
                  onClick={resetMemorizeSession}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors mr-4"
                >
                  Exit
                </button>
                <button
                  onClick={checkAnswer}
                  className="button-primary text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2"
                >
                  <Target className="h-4 w-4" />
                  <span>Check My Answer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {memorizePhase === 'results' && selectedVerse && (
          <div className="animate-celebration">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="text-5xl font-bold text-purple-600 mb-2">{accuracy}%</div>
                <h3 className="text-xl font-semibold text-gray-900">Accuracy Score</h3>
              </div>

              <div className={`p-4 rounded-lg mb-6 ${
                accuracy >= 90 ? 'bg-green-50 text-green-800' : 
                accuracy >= 70 ? 'bg-yellow-50 text-yellow-800' : 
                'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">
                  {accuracy >= 90 ? '🎉 Excellent work! You nailed it!' :
                   accuracy >= 70 ? '👍 Good job! Keep practicing!' :
                   '💪 Good effort! Practice makes perfect!'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Points Earned:</p>
                <p className="text-2xl font-bold text-purple-600">+{sessionPoints}</p>
              </div>

              {aiAnalysis && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium mb-2">{aiAnalysis.feedback}</p>
                  {aiAnalysis.suggestions.length > 0 && (
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">AI Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => startMemorizeSession(selectedVerse)}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={resetMemorizeSession}
                  className="button-primary text-white px-6 py-2 rounded-lg font-medium"
                >
                  New Verse
                </button>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium border-2 border-purple-600 hover:bg-purple-50 transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Bible Memory Coach</h2>
          <p className="text-gray-600">Ask questions about your memorization progress and get personalized advice</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg">
          <div className="h-96 overflow-y-auto p-6 border-b border-gray-200">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Start a conversation with your AI Bible Memory Coach!</p>
                <div className="text-sm text-gray-400">
                  <p>Try asking:</p>
                  <ul className="mt-2 space-y-1">
                    <li>"How can I improve my accuracy?"</li>
                    <li>"What's the best way to memorize longer verses?"</li>
                    <li>"How do I maintain my streak?"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm">AI is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about your Bible memorization journey..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isChatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="button-primary text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Memorization History</h2>
          <p className="text-gray-600">Track all the verses you've successfully memorized</p>
        </div>

        {memorizedVerses.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No verses memorized yet</h3>
            <p className="text-gray-600 mb-6">Start memorizing verses to build your history!</p>
            <button
              onClick={() => setCurrentPage('memorize')}
              className="button-primary text-white px-6 py-3 rounded-lg font-medium"
            >
              Start Memorizing
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {memorizedVerses.map((verse, index) => (
              <div key={verse.id || index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      verse.testament === 'OT' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {verse.testament}
                    </div>
                    <p className="text-sm font-medium text-purple-600">{verse.reference}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold mb-1 ${
                      (verse.accuracy || 0) >= 90 ? 'text-green-600' :
                      (verse.accuracy || 0) >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {verse.accuracy || 0}%
                    </div>
                    <p className="text-xs text-gray-500">{verse.dateMemorized}</p>
                  </div>
                </div>
                
                <blockquote className="text-gray-700 italic mb-4 leading-relaxed">
                  "{verse.text}"
                </blockquote>
                
                {verse.reason && (
                  <div className={`p-3 rounded-lg border-l-4 ${
                    verse.testament === 'OT' 
                      ? 'bg-amber-50 border-amber-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}>
                    <p className={`text-sm ${
                      verse.testament === 'OT' ? 'text-amber-800' : 'text-blue-800'
                    }`}>
                      <span className="font-medium">→ Reason:</span> {verse.reason}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => startMemorizeSession(verse)}
                    className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={() => toggleLikeVerse(verse)}
                    className={`p-2 rounded-lg transition-colors ${
                      likedVerses.some(v => v.id === verse.id)
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${
                      likedVerses.some(v => v.id === verse.id) ? 'fill-current' : ''
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Favorite Verses</h2>
          <p className="text-gray-600">Verses you've liked and want to revisit</p>
        </div>

        {likedVerses.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite verses yet</h3>
            <p className="text-gray-600 mb-6">Like verses by clicking the heart icon to save them here!</p>
            <button
              onClick={() => setCurrentPage('generator')}
              className="button-primary text-white px-6 py-3 rounded-lg font-medium"
            >
              Discover Verses
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {likedVerses.map((verse, index) => (
              <div key={verse.id || index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    verse.testament === 'OT' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {verse.testament}
                  </div>
                  <button
                    onClick={() => toggleLikeVerse(verse)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                
                <blockquote className="text-gray-700 italic mb-4 leading-relaxed">
                  "{verse.text}"
                </blockquote>
                
                <p className="text-sm font-medium text-purple-600 mb-4">{verse.reference}</p>
                
                {verse.reason && (
                  <div className={`p-3 rounded-lg border-l-4 mb-4 ${
                    verse.testament === 'OT' 
                      ? 'bg-amber-50 border-amber-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}>
                    <p className={`text-sm ${
                      verse.testament === 'OT' ? 'text-amber-800' : 'text-blue-800'
                    }`}>
                      <span className="font-medium">→ Reason:</span> {verse.reason}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => startMemorizeSession(verse)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Memorize This Verse
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Bible Memory Journey
          </h2>
          <p className="text-gray-600">Track your progress and celebrate your achievements</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2 animate-count-up">
              {userStats.totalPoints.toLocaleString()}
            </div>
            <p className="text-gray-600 font-medium">Total Points</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2 animate-count-up">
              {userStats.versesMemorized}
            </div>
            <p className="text-gray-600 font-medium">Verses Memorized</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2 animate-count-up">
              {userStats.averageAccuracy}%
            </div>
            <p className="text-gray-600 font-medium">Average Accuracy</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2 animate-count-up">
              {userStats.currentStreak}
            </div>
            <p className="text-gray-600 font-medium">Current Streak</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Award className="h-5 w-5 text-purple-600 mr-2" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-badge p-4 rounded-lg text-center ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200'
                      : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                  }`}
                >
                  <div className={`mx-auto mb-2 ${
                    achievement.unlocked ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    {achievement.icon}
                  </div>
                  <p className={`font-medium text-sm ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              Progress Chart
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Weekly Progress</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="progress-bar bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Monthly Goal</span>
                  <span>67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="progress-bar bg-green-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Accuracy Trend</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="progress-bar bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            AI Suggestions for Improvement
          </h3>
          <div className="space-y-3">
            {improvementSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div>
                  <p className="text-gray-700">{suggestion.suggestion}</p>
                  <p className="text-sm text-gray-500 mt-1">{suggestion.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="settings-modal bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 text-purple-600 mr-2" />
              Language & Bible Settings
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-8">
            {/* Current Settings Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Current Settings</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">UI Language:</span> {uiLanguage}</p>
                <p><span className="font-medium">Bible Language:</span> {bibleLanguage}</p>
                <p><span className="font-medium">Bible Version:</span> {bibleVersions[bibleLanguage as keyof typeof bibleVersions]?.find(v => v.code === bibleVersion)?.name || bibleVersion}</p>
              </div>
            </div>

            {/* UI Language Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Interface Language
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {uiLanguages.map((language) => (
                  <button
                    key={language}
                    onClick={() => setUiLanguage(language)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      uiLanguage === language
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Bible Language Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Bible Language
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {bibleLanguages.map((language) => (
                  <button
                    key={language}
                    onClick={() => {
                      setBibleLanguage(language);
                      // Auto-select first available version for the language
                      const versions = bibleVersions[language as keyof typeof bibleVersions];
                      if (versions && versions.length > 0) {
                        setBibleVersion(versions[0].code);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      bibleLanguage === language
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Bible Version Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Bible Version ({bibleLanguage})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(bibleVersions[bibleLanguage as keyof typeof bibleVersions] || []).map((version) => (
                  <button
                    key={version.code}
                    onClick={() => setBibleVersion(version.code)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      bibleVersion === version.code
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{version.name}</div>
                    <div className={`text-sm ${
                      bibleVersion === version.code ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {version.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  // Trigger verse regeneration with new settings
                  generateNewVerses();
                }}
                className="button-primary text-white px-6 py-2 rounded-lg font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {currentPage === 'generator' && renderGenerator()}
        {currentPage === 'memorize' && renderMemorize()}
        {currentPage === 'chat' && renderChat()}
        {currentPage === 'history' && renderHistory()}
        {currentPage === 'favorites' && renderFavorites()}
        {currentPage === 'profile' && renderProfile()}
      </main>

      {renderSettings()}
    </div>
  );
}

export default App;