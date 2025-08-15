import React from 'react';
import { Home, Brain, Search, Heart, History, User } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'generator' as Tab, label: 'Generator', icon: Home },
    { id: 'memorize' as Tab, label: 'Memorize', icon: Brain },
    { id: 'search' as Tab, label: 'Search', icon: Search },
    { id: 'favorites' as Tab, label: 'Favorites', icon: Heart },
    { id: 'history' as Tab, label: 'History', icon: History },
    { id: 'profile' as Tab, label: 'Profile', icon: User }
  ];

  return (
    <nav className="bg-white/60 backdrop-blur-sm border-b border-purple-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`nav-tab flex items-center space-x-2 px-6 py-3 rounded-t-lg font-medium transition-all ${
                activeTab === id
                  ? 'active'
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
  );
};

export default Navigation;