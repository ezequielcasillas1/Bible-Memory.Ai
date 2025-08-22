import { useState, useEffect } from 'react';
import { TranslationService } from '../services/translationService';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(TranslationService.getCurrentLanguage());
  const [currentBibleLanguage, setCurrentBibleLanguage] = useState(TranslationService.getCurrentBibleLanguage());

  const t = (key: string, fallback?: string): string => {
    return TranslationService.translate(key, fallback);
  };

  const changeLanguage = (languageCode: string) => {
    TranslationService.setLanguage(languageCode);
    setCurrentLanguage(languageCode);
  };

  const changeBibleLanguage = (languageCode: string) => {
    TranslationService.setBibleLanguage(languageCode);
    setCurrentBibleLanguage(languageCode);
  };

  const translateText = async (text: string, targetLanguage?: string) => {
    return await TranslationService.translateText(text, targetLanguage || currentLanguage);
  };

  const translateBibleVerse = async (verse: string, reference: string, targetLanguage?: string) => {
    return await TranslationService.translateBibleVerse(verse, reference, targetLanguage || currentBibleLanguage);
  };

  return {
    t,
    currentLanguage,
    currentBibleLanguage,
    changeLanguage,
    changeBibleLanguage,
    translateText,
    translateBibleVerse
  };
};