import React from 'react';
import { Trophy, BookOpen, Flame, Target, Calendar, TrendingUp, Award, Star } from 'lucide-react';
import { UserStats } from '../types';

interface ProfilePageProps {
  userStats: UserStats;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userStats }) => {
  const achievements = [
    { id: '1', name: 'First Verse', description: 'Memorized your first verse', icon: '🏆', unlocked: userStats.versesMemorized >= 1 },
    { id: '2', name: '7-Day Streak', description: 'Practiced for 7 days in a row', icon: '⭐', unlocked: userStats.currentStreak >= 7 },
    { id: '3', name: 'OT Explorer', description: 'Memorized 5 Old Testament verses', icon: '📖', unlocked: userStats.versesMemorized >= 5 },
    { id: '4', name: 'NT Scholar', description: 'Memorized 5 New Testament verses', icon: '✝️', unlocked: userStats.versesMemorized >= 5 },
    { id: '5', name: 'Accuracy Master', description: 'Achieved 95% accuracy', icon: '🎯', unlocked: userStats.averageAccuracy >= 95 },
    { id: '6', name: 'Point Collector', description: 'Earned 1000 points', icon: '💎', unlocked: userStats.totalPoints >= 1000 }
  ];

  const improvementSuggestions = [
    "Focus on longer verses to build endurance and deepen understanding",
    "Practice Old Testament historical books for broader knowledge",
    "Try memorizing verse pairs for better context understanding"
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mr-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">👤 Your Bible Memory Journey</h2>
            <p className="text-gray-600">Track your progress and achievements</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Points', value: userStats.totalPoints.toLocaleString(), icon: Trophy, color: 'yellow' },
          { label: 'Verses Memorized', value: userStats.versesMemorized, icon: BookOpen, color: 'blue' },
          { label: 'Current Streak', value: `${userStats.currentStreak} days`, icon: Flame, color: 'orange' },
          { label: 'Average Accuracy', value: `${Math.round(userStats.averageAccuracy)}%`, icon: Target, color: 'green' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{label}</p>
                <p className="text-2xl font-bold animate-count-up">{value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${color}-100`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-600" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-badge p-4 rounded-xl border-2 text-center transition-all ${
                  achievement.unlocked
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className="font-medium text-sm text-gray-800">{achievement.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                {achievement.unlocked && (
                  <div className="mt-2">
                    <Star className="w-4 h-4 text-yellow-500 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Weekly Progress
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goal: {userStats.weeklyGoal} verses</span>
              <span className="text-sm font-medium">{userStats.versesMemorized} / {userStats.weeklyGoal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="progress-bar bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full"
                style={{ width: `${Math.min(100, (userStats.versesMemorized / userStats.weeklyGoal) * 100)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div
                  key={index}
                  className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                    index < userStats.currentStreak
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Improvement Suggestions */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🤖</span>
          AI Suggestions for Improvement
        </h3>
        <div className="space-y-3">
          {improvementSuggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <p className="text-gray-700">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;