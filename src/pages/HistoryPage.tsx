import React, { useState, useEffect } from 'react';
import { History, TrendingUp, Target, Clock, BookOpen, Plus, Edit3, Trash2 } from 'lucide-react';
import { MemorizationHistory, ImprovementPlan, AppSettings, UserStats } from '../types';
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
  const [showMockData, setShowMockData] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    targetVerses: '',
    accuracyGoal: 90,
    timeframe: 30,
    dailyPractice: 15
  });

  // Add mock data for testing
  const addMockHistoryEntry = () => {
    const mockEntry: MemorizationHistory = {
      id: `mock-${Date.now()}`,
      verse: {
        id: 'mock-verse-1',
        text: "And the Lord said unto Moses, 'Behold, I have given thee wisdom to lead my people through the wilderness of code, that they might find rest in the promised land of working applications.'",
        reference: "Debuggicus 3:16",
        testament: 'OT'
      },
      attempts: 3,
      bestAccuracy: 87,
      averageAccuracy: 82,
      totalTime: 145,
      lastPracticed: new Date(),
      status: 'reviewing'
    };
    
    setHistory(prev => [mockEntry, ...prev]);
    console.log('Added mock history entry:', mockEntry);
  };

  const clearMockData = () => {
    setHistory(prev => prev.filter(item => !item.id.startsWith('mock-')));
    console.log('Cleared mock history entries');
  };

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
              onClick={addMockHistoryEntry}
              className="text-sm bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg"
            >
              Add Mock Entry
            </button>
            <button
              onClick={clearMockData}
              className="text-sm bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-lg"
            >
              Clear Mock
            </button>
            <button
              onClick={handleManualRefresh}
              className="text-sm text-purple-600 hover:text-purple-800 px-3 py-1 border border-purple-200 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Debug Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={addMockHistoryEntry}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Mock Entry
          </button>
          <button
            onClick={clearMockData}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear Mock
          </button>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
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
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(item.lastPracticed).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => onMemorizeVerse(item.verse)}
                    className="text-xs text-purple-600 hover:text-purple-800 mt-1 block"
                  >
                    Practice Again
                  </button>
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
    </div>
  );
};

export default HistoryPage;