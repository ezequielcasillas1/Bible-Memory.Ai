import React from 'react';
import { Home, Brain, Search, Heart, History, User } from 'lucide-react';
import { Tab } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'generator' as Tab, label: t('nav.generator'), icon: Home },
    { id: 'memorize' as Tab, label: t('nav.memorize'), icon: Brain },
    { id: 'search' as Tab, label: t('nav.search'), icon: Search },
    { id: 'favorites' as Tab, label: t('nav.favorites'), icon: Heart },
    { id: 'history' as Tab, label: t('nav.history'), icon: History },
    { id: 'profile' as Tab, label: t('nav.profile'), icon: User }
  ];

  return (
    <nav className="bg-white/60 backdrop-blur-sm border-b border-purple-100 overflow-x-auto">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex space-x-0.5 sm:space-x-1 min-w-max sm:min-w-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`nav-tab flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'active'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-white/40'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;