import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Verse } from '../types';
import { TranslationService, TranslationResult } from '../services/translationService';

export interface TranslatedVerse extends Verse {
  translatedText?: string;
  isTranslated?: boolean;
  translationLanguage?: string;
  originalText?: string;
}

interface AutoTranslationContextType {
  autoTranslateVerse: (verse: Verse) => TranslatedVerse;
  isAutoTranslating: boolean;
  translationError: string | null;
  clearTranslationCache: () => void;
  getTranslatedVerse: (verse: Verse, targetLanguage?: string) => TranslatedVerse;
}

interface AutoTranslationProviderProps {
  children: ReactNode;
  preferredTranslationLanguage: string;
  preferredVersion: string;
}

// Translation cache to avoid redundant API calls
interface TranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    language: string;
  };
}

const AutoTranslationContext = createContext<AutoTranslationContextType | undefined>(undefined);

export const useAutoTranslation = (): AutoTranslationContextType => {
  const context = useContext(AutoTranslationContext);
  if (!context) {
    throw new Error('useAutoTranslation must be used within an AutoTranslationProvider');
  }
  return context;
};

export const AutoTranslationProvider: React.FC<AutoTranslationProviderProps> = ({ 
  children, 
  preferredTranslationLanguage,
  preferredVersion 
}) => {
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [pendingTranslations, setPendingTranslations] = useState<Set<string>>(new Set());

  // Cache duration: 24 hours
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  // Generate cache key for verse + language combination
  const getCacheKey = (verse: Verse, language: string): string => {
    return `${verse.id || verse.reference}-${language}-${verse.version || preferredVersion}`;
  };

  // Check if cached translation is still valid
  const isCacheValid = (cacheEntry: TranslationCache[string]): boolean => {
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  };

  // Auto-translate verse if preferred language is set
  const autoTranslateVerse = (verse: Verse): TranslatedVerse => {
    // If no preferred language is set, return original verse
    if (!preferredTranslationLanguage) {
      return verse;
    }

    const cacheKey = getCacheKey(verse, preferredTranslationLanguage);
    const cachedTranslation = translationCache[cacheKey];

    // Return cached translation if valid
    if (cachedTranslation && isCacheValid(cachedTranslation)) {
      return {
        ...verse,
        text: cachedTranslation.translatedText,
        translatedText: cachedTranslation.translatedText,
        isTranslated: true,
        translationLanguage: cachedTranslation.language,
        originalText: verse.text
      };
    }

    // Start translation if not already pending
    if (!pendingTranslations.has(cacheKey)) {
      translateVerseAsync(verse, preferredTranslationLanguage, cacheKey);
    }

    // Return original verse while translation is pending
    return verse;
  };

  // Get translated verse for specific language (for manual translations)
  const getTranslatedVerse = (verse: Verse, targetLanguage?: string): TranslatedVerse => {
    const language = targetLanguage || preferredTranslationLanguage;
    if (!language) return verse;

    const cacheKey = getCacheKey(verse, language);
    const cachedTranslation = translationCache[cacheKey];

    if (cachedTranslation && isCacheValid(cachedTranslation)) {
      return {
        ...verse,
        text: cachedTranslation.translatedText,
        translatedText: cachedTranslation.translatedText,
        isTranslated: true,
        translationLanguage: cachedTranslation.language,
        originalText: verse.text
      };
    }

    return verse;
  };

  // Async translation function
  const translateVerseAsync = async (verse: Verse, targetLanguage: string, cacheKey: string) => {
    try {
      setIsAutoTranslating(true);
      setTranslationError(null);
      setPendingTranslations(prev => new Set(prev).add(cacheKey));

      const result: TranslationResult = await TranslationService.translateVerse(
        verse.text,
        targetLanguage,
        verse.version || preferredVersion,
        verse.reference
      );

      // Update cache with successful translation
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: {
          translatedText: result.translatedText,
          timestamp: Date.now(),
          language: targetLanguage
        }
      }));

      setTranslationError(null);
    } catch (error) {
      console.error('Auto-translation failed:', error);
      setTranslationError(`Auto-translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAutoTranslating(false);
      setPendingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  };

  // Clear translation cache
  const clearTranslationCache = () => {
    setTranslationCache({});
    setTranslationError(null);
  };

  // Load cache from localStorage on mount
  useEffect(() => {
    const savedCache = localStorage.getItem('autoTranslationCache');
    if (savedCache) {
      try {
        const parsedCache: TranslationCache = JSON.parse(savedCache);
        // Filter out expired cache entries
        const validCache: TranslationCache = {};
        Object.entries(parsedCache).forEach(([key, entry]) => {
          if (isCacheValid(entry)) {
            validCache[key] = entry;
          }
        });
        setTranslationCache(validCache);
      } catch (error) {
        console.error('Failed to load translation cache:', error);
      }
    }
  }, []);

  // Save cache to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('autoTranslationCache', JSON.stringify(translationCache));
  }, [translationCache]);

  const value: AutoTranslationContextType = {
    autoTranslateVerse,
    isAutoTranslating,
    translationError,
    clearTranslationCache,
    getTranslatedVerse
  };

  return (
    <AutoTranslationContext.Provider value={value}>
      {children}
    </AutoTranslationContext.Provider>
  );
};

export type { TranslatedVerse };
