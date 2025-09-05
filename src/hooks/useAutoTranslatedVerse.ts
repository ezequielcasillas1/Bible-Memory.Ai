import { useMemo } from 'react';
import { Verse } from '../types';
import { useAutoTranslation, TranslatedVerse } from '../contexts/AutoTranslationContext';

/**
 * Custom hook that automatically translates a verse based on user's preferred translation language
 * Returns the translated verse if available, otherwise returns the original verse
 */
export const useAutoTranslatedVerse = (verse: Verse | null): TranslatedVerse | null => {
  const { autoTranslateVerse } = useAutoTranslation();

  const translatedVerse = useMemo(() => {
    if (!verse) return null;
    return autoTranslateVerse(verse);
  }, [verse, autoTranslateVerse]);

  return translatedVerse;
};

/**
 * Custom hook for translating multiple verses
 * Useful for pages that display multiple verses at once
 */
export const useAutoTranslatedVerses = (verses: Verse[]): TranslatedVerse[] => {
  const { autoTranslateVerse } = useAutoTranslation();

  const translatedVerses = useMemo(() => {
    return verses.map(verse => autoTranslateVerse(verse));
  }, [verses, autoTranslateVerse]);

  return translatedVerses;
};

/**
 * Hook that provides both auto-translated verse and manual translation capabilities
 * This maintains the existing manual translation functionality while adding auto-translation
 */
export const useVerseTranslation = (verse: Verse | null) => {
  const { autoTranslateVerse, getTranslatedVerse, isAutoTranslating, translationError } = useAutoTranslation();

  const autoTranslatedVerse = useMemo(() => {
    if (!verse) return null;
    return autoTranslateVerse(verse);
  }, [verse, autoTranslateVerse]);

  const getManualTranslation = (targetLanguage: string): TranslatedVerse | null => {
    if (!verse) return null;
    return getTranslatedVerse(verse, targetLanguage);
  };

  return {
    autoTranslatedVerse,
    getManualTranslation,
    isAutoTranslating,
    translationError,
    originalVerse: verse
  };
};
