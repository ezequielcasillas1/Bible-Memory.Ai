import React from 'react';
import { BookOpen, Settings, Trophy, LogIn, LogOut, User } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  totalPoints: number;
  onSettingsClick: () => void;
  user: SupabaseUser | null;
  onAuthClick: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ totalPoints, onSettingsClick, user, onAuthClick, onSignOut }) => {
  return (
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
            {user ? (
              <>
                <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-sm animate-count-up">{totalPoints}</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-white/60 rounded-full px-3 py-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                
                <button
                  onClick={onSettingsClick}
                  className="p-2 hover:bg-white/60 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={onSignOut}
                  className="p-2 hover:bg-white/60 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full hover:scale-105 transition-transform"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;