import React, { createContext, useContext, useState, useEffect } from 'react';
import { UITranslationService } from '../services/uiTranslationService';

// UI Language definitions
export interface UILanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const UI_LANGUAGES: UILanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'zh-cn', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' }
];

// Translation strings for UI elements
export interface Translations {
  // Header
  'header.title': string;
  'header.subtitle': string;
  'header.signIn': string;
  'header.signOut': string;
  'header.settings': string;

  // Navigation
  'nav.generator': string;
  'nav.memorize': string;
  'nav.search': string;
  'nav.favorites': string;
  'nav.history': string;
  'nav.profile': string;

  // Generator Page
  'generator.title': string;
  'generator.commission': string;
  'generator.help': string;
  'generator.oldTestament': string;
  'generator.newTestament': string;
  'generator.generateNew': string;
  'generator.connectionInsight': string;

  // Memorize Page
  'memorize.studyVerse': string;
  'memorize.reciteFromMemory': string;
  'memorize.checkAnswer': string;
  'memorize.tryAgain': string;
  'memorize.newVerse': string;
  'memorize.startStudy': string;
  'memorize.pause': string;
  'memorize.resume': string;

  // Search Page
  'search.title': string;
  'search.subtitle': string;
  'search.placeholder': string;
  'search.searchButton': string;
  'search.addNote': string;
  'search.editNote': string;
  'search.favorite': string;
  'search.translate': string;
  'search.memorize': string;

  // Settings
  'settings.title': string;
  'settings.studyTime': string;
  'settings.bibleVersion': string;
  'settings.uiLanguage': string;
  'settings.translationLanguage': string;
  'settings.save': string;
  'settings.cancel': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.close': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.add': string;
}

const translations: Record<string, Translations> = {
  en: {
    // Header
    'header.title': 'Bible Memory AI',
    'header.subtitle': 'Memorize Scripture with AI assistance',
    'header.signIn': 'Sign In',
    'header.signOut': 'Sign Out',
    'header.settings': 'Settings',

    // Navigation
    'nav.generator': 'Generator',
    'nav.memorize': 'Memorize',
    'nav.search': 'Search',
    'nav.favorites': 'Favorites',
    'nav.history': 'History',
    'nav.profile': 'Profile',

    // Generator Page
    'generator.title': 'Receive Today\'s Commission or Help People Verses',
    'generator.commission': 'Commission Verses',
    'generator.help': 'Help People Verses',
    'generator.oldTestament': 'Old Testament',
    'generator.newTestament': 'New Testament',
    'generator.generateNew': 'Generate New Verses',
    'generator.connectionInsight': 'Connection Insight',

    // Memorize Page
    'memorize.studyVerse': 'Study Your Verse',
    'memorize.reciteFromMemory': 'Recite from Memory',
    'memorize.checkAnswer': 'Check My Answer',
    'memorize.tryAgain': 'Try Again',
    'memorize.newVerse': 'New Verse',
    'memorize.startStudy': 'Start Study Session',
    'memorize.pause': 'Pause',
    'memorize.resume': 'Resume',

    // Search Page
    'search.title': 'Bible Search',
    'search.subtitle': 'Search Scripture, take notes, and prepare for memorization',
    'search.placeholder': 'Search for verses, topics, or references (e.g., \'love\', \'John 3:16\', \'faith\')',
    'search.searchButton': 'Search',
    'search.addNote': 'Add Note',
    'search.editNote': 'Edit Note',
    'search.favorite': 'Favorite',
    'search.translate': 'Translate',
    'search.memorize': 'Memorize',

    // Settings
    'settings.title': 'Settings',
    'settings.studyTime': 'Study Time (seconds)',
    'settings.bibleVersion': 'Preferred Bible Version',
    'settings.uiLanguage': 'Interface Language',
    'settings.translationLanguage': 'Bible Translation Language',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
  },
  es: {
    // Header
    'header.title': 'Memoria Bíblica IA',
    'header.subtitle': 'Memoriza las Escrituras con asistencia de IA',
    'header.signIn': 'Iniciar Sesión',
    'header.signOut': 'Cerrar Sesión',
    'header.settings': 'Configuración',

    // Navigation
    'nav.generator': 'Generador',
    'nav.memorize': 'Memorizar',
    'nav.search': 'Buscar',
    'nav.favorites': 'Favoritos',
    'nav.history': 'Historial',
    'nav.profile': 'Perfil',

    // Generator Page
    'generator.title': 'Recibe los Versículos de Comisión o Ayuda de Hoy',
    'generator.commission': 'Versículos de Comisión',
    'generator.help': 'Versículos de Ayuda',
    'generator.oldTestament': 'Antiguo Testamento',
    'generator.newTestament': 'Nuevo Testamento',
    'generator.generateNew': 'Generar Nuevos Versículos',
    'generator.connectionInsight': 'Perspectiva de Conexión',

    // Memorize Page
    'memorize.studyVerse': 'Estudia tu Versículo',
    'memorize.reciteFromMemory': 'Recita de Memoria',
    'memorize.checkAnswer': 'Verificar mi Respuesta',
    'memorize.tryAgain': 'Intentar de Nuevo',
    'memorize.newVerse': 'Nuevo Versículo',
    'memorize.startStudy': 'Iniciar Sesión de Estudio',
    'memorize.pause': 'Pausar',
    'memorize.resume': 'Reanudar',

    // Search Page
    'search.title': 'Búsqueda Bíblica',
    'search.subtitle': 'Busca las Escrituras, toma notas y prepárate para memorizar',
    'search.placeholder': 'Busca versículos, temas o referencias (ej., \'amor\', \'Juan 3:16\', \'fe\')',
    'search.searchButton': 'Buscar',
    'search.addNote': 'Agregar Nota',
    'search.editNote': 'Editar Nota',
    'search.favorite': 'Favorito',
    'search.translate': 'Traducir',
    'search.memorize': 'Memorizar',

    // Settings
    'settings.title': 'Configuración',
    'settings.studyTime': 'Tiempo de Estudio (segundos)',
    'settings.bibleVersion': 'Versión Bíblica Preferida',
    'settings.uiLanguage': 'Idioma de la Interfaz',
    'settings.translationLanguage': 'Idioma de Traducción Bíblica',
    'settings.save': 'Guardar',
    'settings.cancel': 'Cancelar',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
  },
  fr: {
    // Header
    'header.title': 'Mémoire Biblique IA',
    'header.subtitle': 'Mémorisez les Écritures avec l\'assistance de l\'IA',
    'header.signIn': 'Se Connecter',
    'header.signOut': 'Se Déconnecter',
    'header.settings': 'Paramètres',

    // Navigation
    'nav.generator': 'Générateur',
    'nav.memorize': 'Mémoriser',
    'nav.search': 'Rechercher',
    'nav.favorites': 'Favoris',
    'nav.history': 'Historique',
    'nav.profile': 'Profil',

    // Generator Page
    'generator.title': 'Recevez les Versets de Commission ou d\'Aide d\'Aujourd\'hui',
    'generator.commission': 'Versets de Commission',
    'generator.help': 'Versets d\'Aide',
    'generator.oldTestament': 'Ancien Testament',
    'generator.newTestament': 'Nouveau Testament',
    'generator.generateNew': 'Générer de Nouveaux Versets',
    'generator.connectionInsight': 'Aperçu de Connexion',

    // Memorize Page
    'memorize.studyVerse': 'Étudiez votre Verset',
    'memorize.reciteFromMemory': 'Réciter de Mémoire',
    'memorize.checkAnswer': 'Vérifier ma Réponse',
    'memorize.tryAgain': 'Réessayer',
    'memorize.newVerse': 'Nouveau Verset',
    'memorize.startStudy': 'Commencer la Session d\'Étude',
    'memorize.pause': 'Pause',
    'memorize.resume': 'Reprendre',

    // Search Page
    'search.title': 'Recherche Biblique',
    'search.subtitle': 'Recherchez les Écritures, prenez des notes et préparez-vous à mémoriser',
    'search.placeholder': 'Recherchez des versets, sujets ou références (ex., \'amour\', \'Jean 3:16\', \'foi\')',
    'search.searchButton': 'Rechercher',
    'search.addNote': 'Ajouter une Note',
    'search.editNote': 'Modifier la Note',
    'search.favorite': 'Favori',
    'search.translate': 'Traduire',
    'search.memorize': 'Mémoriser',

    // Settings
    'settings.title': 'Paramètres',
    'settings.studyTime': 'Temps d\'Étude (secondes)',
    'settings.bibleVersion': 'Version Biblique Préférée',
    'settings.uiLanguage': 'Langue de l\'Interface',
    'settings.translationLanguage': 'Langue de Traduction Biblique',
    'settings.save': 'Sauvegarder',
    'settings.cancel': 'Annuler',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.close': 'Fermer',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
  }
  // Add more languages as needed...
};

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => void;
  t: (key: keyof Translations) => string;
  availableLanguages: UILanguage[];
  isTranslating: boolean;
  translationError: string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, Translations>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('uiLanguage');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Also check settings localStorage for backward compatibility
      const savedSettings = localStorage.getItem('bibleMemorySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.uiLanguage && translations[parsedSettings.uiLanguage]) {
          setCurrentLanguage(parsedSettings.uiLanguage);
        }
      }
    }
  }, []);

  // Load dynamic translations when language changes
  useEffect(() => {
    const loadDynamicTranslations = async () => {
      if (currentLanguage === 'en' || translations[currentLanguage]) {
        return; // Use static translations for English or already available languages
      }

      setIsTranslating(true);
      setTranslationError(null);
      try {
        // Get all English translation keys and values
        const englishTranslations = translations['en'];
        const keys = Object.keys(englishTranslations) as (keyof Translations)[];
        const texts = keys.map(key => englishTranslations[key]);

        console.log(`Loading UI translations for ${currentLanguage}...`);
        const result = await UITranslationService.translateUITexts(texts, currentLanguage);
        
        if (result.translations && !result.fallback) {
          // Create dynamic translation object
          const dynamicTranslation: Translations = {} as Translations;
          keys.forEach((key, index) => {
            (dynamicTranslation as any)[key] = result.translations[index] || englishTranslations[key];
          });

          setDynamicTranslations(prev => ({
            ...prev,
            [currentLanguage]: dynamicTranslation
          }));
          console.log(`Successfully loaded ${result.translations.length} translations for ${currentLanguage}`);
        } else if (result.fallback) {
          console.log(`Using fallback translations for ${currentLanguage}`);
          setTranslationError('Translation service unavailable, using English');
        }
      } catch (error) {
        console.error('Failed to load dynamic translations:', error);
        const message = error instanceof Error ? error.message : String(error);
        setTranslationError(`Translation failed: ${message}`);
      } finally {
        setIsTranslating(false);
      }
    };

    loadDynamicTranslations();
  }, [currentLanguage]);

  const setLanguage = (languageCode: string) => {
    if (translations[languageCode] || UI_LANGUAGES.find(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('uiLanguage', languageCode);
      
      // Also update the settings localStorage for consistency
      const savedSettings = localStorage.getItem('bibleMemorySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.uiLanguage = languageCode;
        localStorage.setItem('bibleMemorySettings', JSON.stringify(parsedSettings));
      }
    }
  };

  const t = (key: keyof Translations): string => {
    // Try dynamic translations first, then static translations, then fallback to English
    return dynamicTranslations[currentLanguage]?.[key] || 
           translations[currentLanguage]?.[key] || 
           translations['en'][key] || 
           key;
  };

  const value = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages: UI_LANGUAGES,
    isTranslating,
    translationError
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};