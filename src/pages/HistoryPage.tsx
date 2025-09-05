import React, { useState, useEffect } from 'react';
import { History, TrendingUp, Target, Clock, BookOpen, Plus, Edit3, Trash2 } from 'lucide-react';
import { MemorizationHistory, ImprovementPlan, AppSettings, UserStats } from '../types';
import { useAutoTranslatedVerse } from '../hooks/useAutoTranslatedVerse';
import { HistoryService } from '../services/historyService';
import { BibleVersion } from '../services/BibleAPI';

interface HistoryPageProps {
  settings: AppSettings;
  userStats: UserStats;
  onMemorizeVerse: (verse: any) => void;
  availableBibleVersions: BibleVersion[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ settings, userStats, onMemorizeVerse, availableBibleVersions }) => {
  const [history, setHistory] = useState<MemorizationHistory[]>([]);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MemorizationHistory | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<MemorizationHistory | null>(null);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    targetVerses: '',
    accuracyGoal: 90,
    timeframe: 30,
    dailyPractice: 15
  });

  

  // Load data from Supabase
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const historyData = await HistoryService.getMemorizationHistory();
        console.log('Loaded history from Supabase:', historyData.length, 'entries');
        setHistory(historyData);
        
        // Load improvement plans from localStorage (keeping this for now)
        const savedPlans = localStorage.getItem('bibleMemoryPlans');
        if (savedPlans) {
          try {
            setImprovementPlans(JSON.parse(savedPlans));
          } catch (error) {
            console.error('Failed to parse plans:', error);
            setImprovementPlans([]);
          }
        }
      } catch (error) {
        console.error('Failed to load history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Refresh history when navigating to this page
  useEffect(() => {
    const refreshHistory = async () => {
      try {
        const historyData = await HistoryService.getMemorizationHistory();
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to refresh history:', error);
      }
    };

    // Set up interval to refresh history every 5 seconds when on this page
    const interval = setInterval(refreshHistory, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for focus events to refresh history
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const historyData = await HistoryService.getMemorizationHistory();
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to refresh history on focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Manual refresh function
  const refreshHistory = async () => {
    setIsLoading(true);
    try {
      const historyData = await HistoryService.getMemorizationHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to refresh history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for custom events from other components
  useEffect(() => {
    const handleHistoryUpdate = () => {
      console.log('History update event received, refreshing...');
      refreshHistory();
    };

    window.addEventListener('bibleMemoryHistoryUpdated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('bibleMemoryHistoryUpdated', handleHistoryUpdate);
    };
  }, []);

  // Save improvement plans to localStorage (keeping this for now)
  useEffect(() => {
    if (improvementPlans.length > 0) {
      localStorage.setItem('bibleMemoryPlans', JSON.stringify(improvementPlans));
    }
  }, [improvementPlans]);

  const deleteHistoryEntry = async (entryId: string) => {
    try {
      await HistoryService.deleteHistoryEntry(entryId);
      // Refresh history after deletion
      const updatedHistory = await HistoryService.getMemorizationHistory();
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  };

  // Add manual refresh button for debugging
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    refreshHistory();
  };

  // Debug function to check localStorage
  const checkLocalStorage = () => {
    const localData = localStorage.getItem('bibleMemoryHistory');
    console.log('Current localStorage data:', localData);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        console.log('Parsed localStorage history:', parsed);
      } catch (error) {
        console.error('Failed to parse localStorage:', error);
      }
    }
  };

  // Clear localStorage history (cleanup)
  useEffect(() => {
    // Clean up old localStorage history since we're using Supabase now
    const oldHistory = localStorage.getItem('bibleMemoryHistory');
    if (oldHistory) {
      console.log('Removing old localStorage history data');
      localStorage.removeItem('bibleMemoryHistory');
    }
  }, []);

  // Listen for storage events (in case other tabs update data)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bibleMemoryHistory') {
        console.log('Storage event detected for history');
        refreshHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const createImprovementPlan = () => {
    if (!newPlan.title.trim()) return;

    const plan: ImprovementPlan = {
      id: `plan-${Date.now()}`,
      title: newPlan.title,
      description: newPlan.description,
      targetVerses: newPlan.targetVerses.split(',').map(v => v.trim()).filter(v => v),
      goals: {
        accuracy: newPlan.accuracyGoal,
        timeframe: newPlan.timeframe,
        dailyPractice: newPlan.dailyPractice
      },
      progress: {
        versesCompleted: 0,
        averageAccuracy: 0,
        daysActive: 0
      },
      createdAt: new Date(),
      status: 'active'
    };

    setImprovementPlans([...improvementPlans, plan]);
    setShowCreatePlan(false);
    setNewPlan({
      title: '',
      description: '',
      targetVerses: '',
      accuracyGoal: 90,
      timeframe: 30,
      dailyPractice: 15
    });
  };

  const deletePlan = (planId: string) => {
    setImprovementPlans(improvementPlans.filter(plan => plan.id !== planId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'learning': return 'bg-yellow-100 text-yellow-700';
      case 'reviewing': return 'bg-blue-100 text-blue-700';
      case 'mastered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Interactive comparison renderer for results modal
  const renderInteractiveComparison = (words: any[], type: 'user' | 'original') => {
    return words.map((wordData, index) => {
      const { userWord, originalWord, status, suggestion } = wordData;
      const displayWord = type === 'user' ? userWord : originalWord;
      
      if (!displayWord) return null;
      
      let className = 'px-2 py-1 rounded cursor-pointer transition-all hover:scale-105 mr-1 mb-1 inline-block ';
      
      switch (status) {
        case 'correct':
          className += 'bg-green-200 text-green-800 hover:bg-green-300';
          break;
        case 'incorrect':
          className += 'bg-red-200 text-red-800 hover:bg-red-300';
          break;
        case 'missing':
          className += 'bg-red-200 text-red-800 hover:bg-red-300';
          break;
        case 'extra':
          className += 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300';
          break;
        default:
          className += 'bg-gray-200 text-gray-800';
      }
      
      return (
        <span
          key={index}
          className={className}
          title={suggestion || 'Click for details'}
        >
          {displayWord}
          {status === 'extra' && type === 'user' && ' (+)'}
          {status === 'missing' && type === 'original' && ' (missing)'}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl mr-4">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">📚 Learning History & Plans</h2>
              <p className="text-gray-600">Track your progress and plan your memorization journey</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              className="text-sm text-purple-600 hover:text-purple-800 px-3 py-1 border border-purple-200 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Verses</p>
              <p className="text-2xl font-bold text-purple-600">{userStats.versesMemorized}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(userStats.averageAccuracy)}%</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600">{userStats.currentStreak} days</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Plans</p>
              <p className="text-2xl font-bold text-blue-600">{improvementPlans.filter(p => p.status === 'active').length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Improvement Plans */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Improvement Plans
          </h3>
          <button
            onClick={() => setShowCreatePlan(true)}
            className="button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>

        {improvementPlans.length > 0 ? (
          <div className="space-y-4">
            {improvementPlans.map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{plan.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Goal: {plan.goals.accuracy}% accuracy</span>
                      <span>{plan.goals.timeframe} days</span>
                      <span>{plan.goals.dailyPractice} min/day</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{plan.progress.versesCompleted}/{plan.targetVerses.length} verses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(plan.progress.versesCompleted / Math.max(plan.targetVerses.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Target Verses */}
                <div className="flex flex-wrap gap-2">
                  {plan.targetVerses.slice(0, 3).map((verse, index) => (
                    <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {verse}
                    </span>
                  ))}
                  {plan.targetVerses.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{plan.targetVerses.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No improvement plans yet. Create your first plan to track your progress!</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-600" />
          Recent Activity
        </h3>
        
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-purple-200">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedHistoryItem(item)}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{item.verse.reference}</p>
                      <p className="text-sm text-gray-600">
                        {item.attempts} attempt{item.attempts !== 1 ? 's' : ''} • Best: {item.bestAccuracy}% • Avg: {Math.round(item.averageAccuracy)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Practice time: {Math.floor(item.totalTime / 60)}m {item.totalTime % 60}s
                      </p>
                      {item.userInput && (
                        <p className="text-xs text-blue-600 mt-1">
                          📝 Click to view your memorization attempt
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(item.lastPracticed).toLocaleDateString()}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {item.comparisonResult && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowResultsModal(item);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          📊 View Results
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMemorizeVerse(item.verse);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Practice Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">
              {isLoading ? 'Loading your history...' : 'No memorization history yet. Start practicing to see your progress!'}
            </p>
            <p className="text-xs text-gray-400">
              Debug: History items in localStorage: {localStorage.getItem('bibleMemoryHistory') ? JSON.parse(localStorage.getItem('bibleMemoryHistory') || '[]').length : 0}
            </p>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Create Improvement Plan</h3>
              <p className="text-gray-600 mt-1">Set goals and track your memorization progress</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Title</label>
                <input
                  type="text"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                  placeholder="e.g., Master the Psalms, New Testament Foundations"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Describe your memorization goals and motivation..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Verses (comma-separated)</label>
                <input
                  type="text"
                  value={newPlan.targetVerses}
                  onChange={(e) => setNewPlan({...newPlan, targetVerses: e.target.value})}
                  placeholder="John 3:16, Romans 8:28, Philippians 4:13"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accuracy Goal (%)</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={newPlan.accuracyGoal}
                    onChange={(e) => setNewPlan({...newPlan, accuracyGoal: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe (days)</label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={newPlan.timeframe}
                    onChange={(e) => setNewPlan({...newPlan, timeframe: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Practice (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={newPlan.dailyPractice}
                    onChange={(e) => setNewPlan({...newPlan, dailyPractice: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreatePlan(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createImprovementPlan}
                disabled={!newPlan.title.trim()}
                className="button-primary disabled:opacity-50"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed History View Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Memorization Result</h3>
                  <p className="text-gray-600 mt-1">{selectedHistoryItem.verse.reference}</p>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedHistoryItem.bestAccuracy}%</div>
                  <div className="text-sm text-purple-700">Best Accuracy</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedHistoryItem.attempts}</div>
                  <div className="text-sm text-blue-700">Attempts</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(selectedHistoryItem.averageAccuracy)}%</div>
                  <div className="text-sm text-green-700">Average</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.floor(selectedHistoryItem.totalTime / 60)}m</div>
                  <div className="text-sm text-orange-700">Total Time</div>
                </div>
              </div>

              {/* Original Verse */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📖 Original Verse</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed italic">
                    "{selectedHistoryItem.verse.text}"
                  </p>
                </div>
              </div>

              {/* User's Input */}
              {selectedHistoryItem.userInput && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">✍️ Your Input</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      "{selectedHistoryItem.userInput}"
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Comparison */}
              {selectedHistoryItem.comparisonResult && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🔍 Detailed Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {selectedHistoryItem.comparisonResult.correctWords || 0}
                        </div>
                        <div className="text-sm text-gray-600">Correct Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {selectedHistoryItem.comparisonResult.incorrectWords || 0}
                        </div>
                        <div className="text-sm text-gray-600">Incorrect Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {selectedHistoryItem.comparisonResult.missingWords || 0}
                        </div>
                        <div className="text-sm text-gray-600">Missing Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {selectedHistoryItem.comparisonResult.extraWords || 0}
                        </div>
                        <div className="text-sm text-gray-600">Extra Words</div>
                      </div>
                    </div>
                    
                    {selectedHistoryItem.comparisonResult.detailedFeedback && (
                      <div className="mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
                        <p className="text-sm text-gray-700">
                          {selectedHistoryItem.comparisonResult.detailedFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Last practiced: {new Date(selectedHistoryItem.lastPracticed).toLocaleDateString()} at {new Date(selectedHistoryItem.lastPracticed).toLocaleTimeString()}
                </div>
                <button
                  onClick={() => {
                    onMemorizeVerse(selectedHistoryItem.verse);
                    setSelectedHistoryItem(null);
                  }}
                  className="button-primary"
                >
                  Practice This Verse Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal - Full Results Page Display */}
      {showResultsModal && showResultsModal.comparisonResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Results</h2>
                  <p className="text-gray-600 mt-1">Here's how you did with your memorization</p>
                  <p className="text-purple-600 font-medium text-sm mt-1">{showResultsModal.verse.reference}</p>
                </div>
                <button
                  onClick={() => setShowResultsModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Accuracy Circle */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-4">
                  <span className="text-4xl font-bold text-red-600">
                    {Math.round(showResultsModal.comparisonResult.accuracy || showResultsModal.bestAccuracy)}%
                  </span>
                </div>
                <p className="text-lg text-red-600 font-medium">
                  Great effort on your memorization! Keep practicing to improve your accuracy.
                </p>
              </div>

              {/* Interactive Verse Comparison */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    📝 Interactive Verse Comparison
                    <span className="ml-auto text-sm font-medium text-gray-600">King James Version</span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* User's Version */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                    <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Your Version ({showResultsModal.comparisonResult.correctWords}/{showResultsModal.comparisonResult.totalWords} correct)
                    </h4>
                    <div className="text-sm leading-relaxed">
                      {renderInteractiveComparison(showResultsModal.comparisonResult.userComparison, 'user')}
                    </div>
                  </div>
                  
                  {/* Original Version */}
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Original Verse
                    </h4>
                    <div className="text-sm leading-relaxed">
                      {renderInteractiveComparison(showResultsModal.comparisonResult.originalComparison, 'original')}
                    </div>
                  </div>
                </div>
                
                {/* Statistics */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {showResultsModal.comparisonResult.correctWords || 0}
                      </div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {showResultsModal.comparisonResult.incorrectWords || 0}
                      </div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {showResultsModal.comparisonResult.missingWords || 0}
                      </div>
                      <div className="text-sm text-gray-600">Missing</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {showResultsModal.comparisonResult.extraWords || 0}
                      </div>
                      <div className="text-sm text-gray-600">Extra</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4 space-x-6 text-xs">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-200 rounded mr-1"></span>
                      <span>Correct</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-red-200 rounded mr-1"></span>
                      <span>Incorrect/Missing</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-200 rounded mr-1"></span>
                      <span>Extra Words</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-purple-200 rounded mr-1"></span>
                      <span>Click any word for details</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-blue-600">{showResultsModal.attempts}</div>
                  <div className="text-sm text-blue-700">Total Attempts</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-green-600">{Math.round(showResultsModal.averageAccuracy)}%</div>
                  <div className="text-sm text-green-700">Average Accuracy</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-orange-600">{Math.floor(showResultsModal.totalTime / 60)}m</div>
                  <div className="text-sm text-orange-700">Total Practice Time</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-purple-600">{showResultsModal.bestAccuracy}%</div>
                  <div className="text-sm text-purple-700">Best Score</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Last practiced: {new Date(showResultsModal.lastPracticed).toLocaleDateString()} at {new Date(showResultsModal.lastPracticed).toLocaleTimeString()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResultsModal(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onMemorizeVerse(showResultsModal.verse);
                      setShowResultsModal(null);
                    }}
                    className="button-primary"
                  >
                    Practice This Verse Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;