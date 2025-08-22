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
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50 safe-area-top">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                Bible Memory AI
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Memorize Scripture with AI assistance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {user ? (
              <>
                <div className="flex items-center space-x-1 sm:space-x-2 bg-white/60 rounded-full px-2 sm:px-4 py-1 sm:py-2">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                  <span className="font-semibold text-xs sm:text-sm animate-count-up">{totalPoints}</span>
                </div>
                
                <div className="hidden sm:flex items-center space-x-2 bg-white/60 rounded-full px-3 py-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                
                <button
                  onClick={onSettingsClick}
                  className="p-1.5 sm:p-2 hover:bg-white/60 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={onSignOut}
                  className="p-1.5 sm:p-2 hover:bg-white/60 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-full hover:scale-105 transition-transform"
              >
                <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium text-sm sm:text-base">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;