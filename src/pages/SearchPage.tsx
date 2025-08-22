import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Plus, Edit3, Tag, Clock, Heart, Globe, Loader2, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { SearchResult, VerseNote, AppSettings } from '../types';
import { BibleSearchService } from '../services/bibleSearchService';
import { getVersionById } from '../data/bibleVersions';
import { BibleVersion } from '../services/BibleAPI';
import { TranslationService, SUPPORTED_LANGUAGES, TranslationResult } from '../services/translationService';

interface SearchPageProps {
  settings: AppSettings;
  onMemorizeVerse: (verse: any) => void;
  availableBibleVersions: BibleVersion[];
}

const SearchPage: React.FC<SearchPageProps> = ({ settings, onMemorizeVerse, availableBibleVersions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<SearchResult | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [translations, setTranslations] = useState<{[key: string]: TranslationResult}>({});
  const [translatingVerses, setTranslatingVerses] = useState<Set<string>>(new Set());

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('bibleMemoryNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('bibleMemoryNotes', JSON.stringify(notes));
  }, [notes]);

  // Load translation language preference
  useEffect(() => {
  }, []);
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await BibleSearchService.searchVerses(searchQuery, settings.preferredVersion, availableBibleVersions);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openNoteModal = (verse: SearchResult) => {
    setSelectedVerse(verse);
    const existingNote = notes.find(note => note.verseId === verse.id);
    if (existingNote) {
      setNoteText(existingNote.note);
      setNoteTags(existingNote.tags.join(', '));
    } else {
      setNoteText('');
      setNoteTags('');
    }
    setShowNoteModal(true);
  };

  const saveNote = () => {
    if (!selectedVerse || !noteText.trim()) return;

    const existingNoteIndex = notes.findIndex(note => note.verseId === selectedVerse.id);
    const newNote: VerseNote = {
      id: existingNoteIndex >= 0 ? notes[existingNoteIndex].id : `note-${Date.now()}`,
      verseId: selectedVerse.id,
      verse: selectedVerse,
      note: noteText.trim(),
      tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: existingNoteIndex >= 0 ? notes[existingNoteIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingNoteIndex >= 0) {
      const updatedNotes = [...notes];
      updatedNotes[existingNoteIndex] = newNote;
      setNotes(updatedNotes);
    } else {
      setNotes([...notes, newNote]);
    }

    setShowNoteModal(false);
    setNoteText('');
    setNoteTags('');
    setSelectedVerse(null);
  };

  const handleTranslate = async (verse: SearchResult) => {
    if (!settings.preferredTranslationLanguage) {
      setShowLanguageModal(true);
      return;
    }

    const translationKey = `${verse.id}-${settings.preferredTranslationLanguage}`;
    if (translations[translationKey]) {
      // Clear existing translation
      const newTranslations = { ...translations };
      delete newTranslations[translationKey];
      setTranslations(newTranslations);
      return;
    }

    setTranslatingVerses(prev => new Set(prev).add(verse.id));

    try {
      const result = await TranslationService.translateVerse(
        verse.text,
        settings.preferredTranslationLanguage,
        verse.version.toLowerCase(),
        verse.reference
      );
      
      setTranslations(prev => ({
        ...prev,
        [translationKey]: result
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTranslatingVerses(prev => {
        const newSet = new Set(prev);
        newSet.delete(verse.id);
        return newSet;
      });
    }
  };

  const getVerseNote = (verseId: string) => {
    return notes.find(note => note.verseId === verseId);
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

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'romance_germanic': return 'text-blue-600 bg-blue-50';
      case 'asian_african': return 'text-green-600 bg-green-50';
      case 'missionary_global': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'romance_germanic': return '🏛️';
      case 'asian_african': return '🌏';
      case 'missionary_global': return '✝️';
      default: return '🌍';
    }
  };

  const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === settings.preferredTranslationLanguage);
  const isRecommended = selectedLangInfo ? 
    TranslationService.isRecommendedPairing(settings.preferredVersion, settings.preferredTranslationLanguage) : false;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mr-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🔍 Bible Search</h2>
            <p className="text-gray-600">Search Scripture, take notes, and prepare for memorization</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for verses, topics, or references (e.g., 'love', 'John 3:16', 'faith')"
              className="w-full p-4 pr-12 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="button-primary disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Version: {getVersionById(settings.preferredVersion, availableBibleVersions)?.name || 'King James Version'}</span>
        </div>

        {/* Translation Language Selection */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Globe className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Translation Language:</span>
            <span className="text-sm text-purple-600 font-medium">
              {selectedLangInfo ? selectedLangInfo.name : 'Not Selected'}
            </span>
          </div>
          
          {!settings.preferredTranslationLanguage && (
            <button
              onClick={() => setShowLanguageModal(true)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Choose Language
            </button>
          )}
        </div>

        {/* Translation Recommendation */}
        {selectedLangInfo && (
          <div className={`mt-3 p-3 rounded-lg border ${
            isRecommended 
              ? 'border-green-200 bg-green-50' 
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-start space-x-2">
              {isRecommended ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  isRecommended ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {isRecommended ? 'Optimal Pairing' : 'Consider Alternative'}
                </p>
                <p className={`text-xs ${
                  isRecommended ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {isRecommended 
                    ? `${settings.preferredVersion.toUpperCase()} works great with ${selectedLangInfo.name}`
                    : `For better accuracy in ${selectedLangInfo.name}, consider: ${selectedLangInfo.recommended.map(v => v.toUpperCase()).join(', ')}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Search Results ({searchResults.length})</h3>
          
          <div className="grid gap-4">
            {searchResults.map((verse) => {
              const note = getVerseNote(verse.id);
              const translationKey = `${verse.id}-${selectedLanguage}`;
              const translation = translations[translationKey];
              const isTranslating = translatingVerses.has(verse.id);
              
              return (
                <div key={verse.id} className="bg-white rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          verse.testament === 'OT' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {verse.testament}
                        </span>
                        <span className="text-purple-600 font-medium">{verse.reference}</span>
                        <span className="text-xs text-gray-500">({verse.version})</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed italic mb-3">
                        "{verse.text}"
                      </p>
                      
                      {note && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Edit3 className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Your Note</span>
                          </div>
                          <p className="text-sm text-yellow-700">{note.note}</p>
                          {note.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Tag className="w-3 h-3 text-yellow-600" />
                              {note.tags.map((tag, index) => (
                                <span key={index} className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Translation Result */}
                  {translation && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStrategyIcon(translation.strategy)}</span>
                          <span className="font-medium text-gray-800">{translation.targetLanguage}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            from {translation.sourceVersion}
                          </span>
                          {translation.isRecommendedPairing && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✓ Recommended
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const newTranslations = { ...translations };
                            delete newTranslations[translationKey];
                            setTranslations(newTranslations);
                          }}
                          className="p-1 hover:bg-white rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-gray-700 text-lg leading-relaxed mb-2">
                        "{translation.translatedText}"
                      </p>
                      {translation.reference && (
                        <p className="text-purple-600 font-medium text-sm">{translation.reference}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openNoteModal(verse)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{note ? 'Edit Note' : 'Add Note'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const favorites = JSON.parse(localStorage.getItem('bibleMemoryFavorites') || '[]');
                        const isAlreadyFavorite = favorites.some((fav: any) => fav.verse.id === verse.id);
                        
                        if (!isAlreadyFavorite) {
                          const newFavorite = {
                            id: `fav-${Date.now()}`,
                            verse,
                            addedAt: new Date()
                          };
                          localStorage.setItem('bibleMemoryFavorites', JSON.stringify([...favorites, newFavorite]));
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm border border-pink-200 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Favorite</span>
                    </button>
                    
                    <button
                      onClick={() => handleTranslate(verse)}
                      disabled={isTranslating}
                      className="flex items-center space-x-2 px-4 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : translation ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span>
                        {isTranslating ? 'Translating...' : translation ? 'Clear' : 'Translate'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => onMemorizeVerse(convertToMemorizeVerse(verse))}
                      className="flex items-center space-x-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:scale-105 transition-transform"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Memorize</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Notes Section */}
      {notes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-purple-600" />
            My Study Notes ({notes.length})
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notes.slice(0, 5).map((note) => (
              <div key={note.id} className="border-l-4 border-purple-400 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-purple-600">{note.verse.reference}</span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                {note.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {note.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {notes.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                And {notes.length - 5} more notes...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">🌍 Choose Translation Language</h2>
                    <p className="text-gray-600">Select a language for Bible verse translations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Romance & Germanic Languages */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🏛️</span>
                  <h4 className="font-medium text-gray-800">Romance & Germanic Languages</h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Best with KJV, ASV, Darby
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'romance_germanic').map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguageModal(false);
                      }}
                      className="p-3 text-left border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-500">{lang.code}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asian & African Languages */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🌏</span>
                  <h4 className="font-medium text-gray-800">Asian & African Languages</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Best with BBE, OEB-US
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'asian_african').map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguageModal(false);
                      }}
                      className="p-3 text-left border rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
                    >
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-500">{lang.code}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Missionary/Global Languages */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">✝️</span>
                  <h4 className="font-medium text-gray-800">Missionary & Global Languages</h4>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Best with WEBBE, OEB-US
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.strategy === 'missionary_global').map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguageModal(false);
                      }}
                      className="p-3 text-left border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-500">{lang.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedVerse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {getVerseNote(selectedVerse.id) ? 'Edit Note' : 'Add Note'}
              </h3>
              <p className="text-purple-600 font-medium mt-1">{selectedVerse.reference}</p>
              <p className="text-sm text-gray-600 italic mt-2">"{selectedVerse.text}"</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Study Notes
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write your thoughts, insights, or study notes about this verse..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="faith, hope, love, prayer..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!noteText.trim()}
                className="button-primary disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isSearching && searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Found</h3>
          <p className="text-gray-500">Try searching with different keywords or Bible references</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;