import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Trash2, Tag, Calendar, Filter } from 'lucide-react';
import { FavoriteVerse, SearchResult, AppSettings } from '../types';
import { BibleVersion } from '../services/BibleAPI';

interface FavoritesPageProps {
  settings: AppSettings;
  onMemorizeVerse: (verse: any) => void;
  availableBibleVersions: BibleVersion[];
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ settings, onMemorizeVerse, availableBibleVersions }) => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('bibleMemoryFavorites');
    if (savedFavorites) {
      const parsedFavorites = JSON.parse(savedFavorites);
      setFavorites(parsedFavorites);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(parsedFavorites
        .map((fav: FavoriteVerse) => fav.category)
        .filter((cat: string) => cat)
      )];
      setCategories(uniqueCategories);
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('bibleMemoryFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  const updateCategory = (id: string, category: string) => {
    setFavorites(favorites.map(fav => 
      fav.id === id ? { ...fav, category: category || undefined } : fav
    ));
  };

  const convertToMemorizeVerse = (searchResult: SearchResult) => {
    return {
      id: searchResult.id,
      text: searchResult.text,
      reference: searchResult.reference,
      testament: searchResult.testament,
      version: searchResult.version
    };
  };

  const filteredFavorites = favorites.filter(fav => 
    filterCategory === 'all' || fav.category === filterCategory
  );

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700'
    ];
    
    const index = category.length % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl mr-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">❤️ Favorite Verses</h2>
              <p className="text-gray-600">Your beloved Scripture collection ({favorites.length} verses)</p>
            </div>
          </div>
        </div>

        {/* Filter by Category */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Favorites List */}
      {filteredFavorites.length > 0 ? (
        <div className="grid gap-4">
          {filteredFavorites.map((favorite) => (
            <div key={favorite.id} className="bg-white rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      favorite.verse.testament === 'OT' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {favorite.verse.testament}
                    </span>
                    <span className="text-purple-600 font-medium">{favorite.verse.reference}</span>
                    <span className="text-xs text-gray-500">({favorite.verse.version})</span>
                    {favorite.category && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(favorite.category)}`}>
                        {favorite.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed italic mb-3">
                    {favorite.verse.html ? (
                      <div className="prose max-w-none" 
                           dangerouslySetInnerHTML={{ __html: `"${favorite.verse.html}"` }} />
                    ) : (
                      <span>"{typeof favorite.verse.text === 'string' ? favorite.verse.text : ''}"</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Added {new Date(favorite.addedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(favorite.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Add category (e.g., Faith, Hope, Love)"
                    value={favorite.category || ''}
                    onChange={(e) => updateCategory(favorite.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => onMemorizeVerse(convertToMemorizeVerse(favorite.verse))}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:scale-105 transition-transform"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Memorize</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {filterCategory === 'all' ? 'No Favorite Verses Yet' : `No Verses in "${filterCategory}" Category`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filterCategory === 'all' 
              ? 'Start adding verses to your favorites from the Search page'
              : 'Try selecting a different category or add verses to this category'
            }
          </p>
          {filterCategory !== 'all' && (
            <button
              onClick={() => setFilterCategory('all')}
              className="button-secondary"
            >
              Show All Favorites
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Favorites Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{favorites.length}</div>
              <div className="text-sm text-gray-600">Total Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {favorites.filter(f => f.verse.testament === 'OT').length}
              </div>
              <div className="text-sm text-gray-600">Old Testament</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {favorites.filter(f => f.verse.testament === 'NT').length}
              </div>
              <div className="text-sm text-gray-600">New Testament</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;