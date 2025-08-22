// Translation service for Bible content and UI localization
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  bibleSupported: boolean;
  popular: boolean;
}

export interface BibleTranslation {
  language: string;
  version: string;
  name: string;
  abbreviation: string;
  apiSource: 'bible-api' | 'bible-gateway' | 'youversion' | 'biblia';
}

// Most popular Bible reading languages based on global Christianity statistics
export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', bibleSupported: true, popular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', bibleSupported: true, popular: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', bibleSupported: true, popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', bibleSupported: true, popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', bibleSupported: true, popular: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', bibleSupported: true, popular: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', bibleSupported: true, popular: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', bibleSupported: true, popular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', bibleSupported: true, popular: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', bibleSupported: true, popular: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', bibleSupported: true, popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', bibleSupported: true, popular: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', bibleSupported: true, popular: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', bibleSupported: true, popular: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', bibleSupported: true, popular: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', bibleSupported: true, popular: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', bibleSupported: true, popular: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', bibleSupported: true, popular: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', bibleSupported: true, popular: false },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', bibleSupported: true, popular: false }
];

// Popular Bible translations by language
export const bibleTranslations: Record<string, BibleTranslation[]> = {
  en: [
    { language: 'en', version: 'kjv', name: 'King James Version', abbreviation: 'KJV', apiSource: 'bible-api' },
    { language: 'en', version: 'asv', name: 'American Standard Version', abbreviation: 'ASV', apiSource: 'bible-api' },
    { language: 'en', version: 'darby', name: 'Darby Translation', abbreviation: 'DARBY', apiSource: 'bible-api' },
    { language: 'en', version: 'bbe', name: 'Bible in Basic English', abbreviation: 'BBE', apiSource: 'bible-api' },
    { language: 'en', version: 'oeb-us', name: 'Open English Bible (US)', abbreviation: 'OEB-US', apiSource: 'bible-api' },
    { language: 'en', version: 'webbe', name: 'World English Bible British Edition', abbreviation: 'WEBBE', apiSource: 'bible-api' }
  ],
  es: [
    { language: 'es', version: 'rvr1960', name: 'Reina-Valera 1960', abbreviation: 'RVR1960', apiSource: 'bible-gateway' },
    { language: 'es', version: 'nvi', name: 'Nueva Versión Internacional', abbreviation: 'NVI', apiSource: 'bible-gateway' },
    { language: 'es', version: 'lbla', name: 'La Biblia de las Américas', abbreviation: 'LBLA', apiSource: 'bible-gateway' }
  ],
  pt: [
    { language: 'pt', version: 'acf', name: 'Almeida Corrigida Fiel', abbreviation: 'ACF', apiSource: 'bible-gateway' },
    { language: 'pt', version: 'nvi-pt', name: 'Nova Versão Internacional', abbreviation: 'NVI', apiSource: 'bible-gateway' },
    { language: 'pt', version: 'arc', name: 'Almeida Revista e Corrigida', abbreviation: 'ARC', apiSource: 'bible-gateway' }
  ],
  fr: [
    { language: 'fr', version: 'lsg', name: 'Louis Segond 1910', abbreviation: 'LSG', apiSource: 'bible-gateway' },
    { language: 'fr', version: 's21', name: 'Segond 21', abbreviation: 'S21', apiSource: 'bible-gateway' },
    { language: 'fr', version: 'bds', name: 'Bible du Semeur', abbreviation: 'BDS', apiSource: 'bible-gateway' }
  ],
  de: [
    { language: 'de', version: 'lut', name: 'Luther Bibel 1912', abbreviation: 'LUT', apiSource: 'bible-gateway' },
    { language: 'de', version: 'elb', name: 'Elberfelder Bibel', abbreviation: 'ELB', apiSource: 'bible-gateway' },
    { language: 'de', version: 'sch2000', name: 'Schlachter 2000', abbreviation: 'SCH2000', apiSource: 'bible-gateway' }
  ],
  it: [
    { language: 'it', version: 'cei', name: 'Conferenza Episcopale Italiana', abbreviation: 'CEI', apiSource: 'bible-gateway' },
    { language: 'it', version: 'nr2006', name: 'Nuova Riveduta 2006', abbreviation: 'NR2006', apiSource: 'bible-gateway' },
    { language: 'it', version: 'lnd', name: 'La Nuova Diodati', abbreviation: 'LND', apiSource: 'bible-gateway' }
  ],
  ru: [
    { language: 'ru', version: 'rst', name: 'Russian Synodal Translation', abbreviation: 'RST', apiSource: 'bible-gateway' },
    { language: 'ru', version: 'cars', name: 'Contemporary Russian Translation', abbreviation: 'CARS', apiSource: 'bible-gateway' }
  ],
  zh: [
    { language: 'zh', version: 'cuv', name: 'Chinese Union Version', abbreviation: 'CUV', apiSource: 'bible-gateway' },
    { language: 'zh', version: 'cnv', name: 'Chinese New Version', abbreviation: 'CNV', apiSource: 'bible-gateway' },
    { language: 'zh', version: 'rcuv', name: 'Revised Chinese Union Version', abbreviation: 'RCUV', apiSource: 'bible-gateway' }
  ],
  ko: [
    { language: 'ko', version: 'krv', name: 'Korean Revised Version', abbreviation: 'KRV', apiSource: 'bible-gateway' },
    { language: 'ko', version: 'nkrv', name: 'New Korean Revised Version', abbreviation: 'NKRV', apiSource: 'bible-gateway' }
  ],
  ja: [
    { language: 'ja', version: 'jlb', name: 'Japanese Living Bible', abbreviation: 'JLB', apiSource: 'bible-gateway' },
    { language: 'ja', version: 'kjv-jp', name: 'Japanese King James Version', abbreviation: 'KJV-JP', apiSource: 'bible-gateway' }
  ],
  ar: [
    { language: 'ar', version: 'svd', name: 'Smith & Van Dyke Arabic Bible', abbreviation: 'SVD', apiSource: 'bible-gateway' },
    { language: 'ar', version: 'nav', name: 'New Arabic Version', abbreviation: 'NAV', apiSource: 'bible-gateway' }
  ],
  hi: [
    { language: 'hi', version: 'hindi', name: 'Hindi Bible', abbreviation: 'HINDI', apiSource: 'bible-gateway' },
    { language: 'hi', version: 'irv-hi', name: 'Indian Revised Version Hindi', abbreviation: 'IRV-HI', apiSource: 'bible-gateway' }
  ],
  sw: [
    { language: 'sw', version: 'swahili', name: 'Swahili Bible', abbreviation: 'SWAHILI', apiSource: 'bible-gateway' },
    { language: 'sw', version: 'bsw', name: 'Biblia Takatifu Swahili', abbreviation: 'BSW', apiSource: 'bible-gateway' }
  ]
};

// UI translations
export const uiTranslations: Record<string, Record<string, string>> = {
  en: {
    // Header
    'app.title': 'Bible Memory AI',
    'app.subtitle': 'Memorize Scripture with AI assistance',
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
    'generator.generate': 'Generate New Verses',
    'generator.connection': 'Connection Insight',
    
    // Memorize Page
    'memorize.study': 'Study Your Verse',
    'memorize.recite': 'Recite from Memory',
    'memorize.results': 'Your Results',
    'memorize.tryAgain': 'Try Again',
    'memorize.newVerse': 'New Verse',
    'memorize.checkAnswer': 'Check My Answer',
    'memorize.startStudy': 'Start Study Session',
    
    // Settings
    'settings.title': 'Settings',
    'settings.studyTime': 'Study Time (seconds)',
    'settings.bibleVersion': 'Preferred Bible Version',
    'settings.language': 'Language',
    'settings.uiLanguage': 'Interface Language',
    'settings.bibleLanguage': 'Bible Language',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.favorite': 'Favorite',
    'common.memorize': 'Memorize',
    'common.accuracy': 'Accuracy',
    'common.oldTestament': 'Old Testament',
    'common.newTestament': 'New Testament'
  },
  es: {
    // Header
    'app.title': 'Biblia Memoria IA',
    'app.subtitle': 'Memoriza las Escrituras con asistencia de IA',
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
    'generator.generate': 'Generar Nuevos Versículos',
    'generator.connection': 'Perspectiva de Conexión',
    
    // Memorize Page
    'memorize.study': 'Estudia Tu Versículo',
    'memorize.recite': 'Recita de Memoria',
    'memorize.results': 'Tus Resultados',
    'memorize.tryAgain': 'Intentar de Nuevo',
    'memorize.newVerse': 'Nuevo Versículo',
    'memorize.checkAnswer': 'Verificar Mi Respuesta',
    'memorize.startStudy': 'Iniciar Sesión de Estudio',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.studyTime': 'Tiempo de Estudio (segundos)',
    'settings.bibleVersion': 'Versión Bíblica Preferida',
    'settings.language': 'Idioma',
    'settings.uiLanguage': 'Idioma de la Interfaz',
    'settings.bibleLanguage': 'Idioma de la Biblia',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
    'common.favorite': 'Favorito',
    'common.memorize': 'Memorizar',
    'common.accuracy': 'Precisión',
    'common.oldTestament': 'Antiguo Testamento',
    'common.newTestament': 'Nuevo Testamento'
  },
  pt: {
    // Header
    'app.title': 'Bíblia Memória IA',
    'app.subtitle': 'Memorize as Escrituras com assistência de IA',
    'header.signIn': 'Entrar',
    'header.signOut': 'Sair',
    'header.settings': 'Configurações',
    
    // Navigation
    'nav.generator': 'Gerador',
    'nav.memorize': 'Memorizar',
    'nav.search': 'Buscar',
    'nav.favorites': 'Favoritos',
    'nav.history': 'Histórico',
    'nav.profile': 'Perfil',
    
    // Generator Page
    'generator.title': 'Receba os Versículos de Comissão ou Ajuda de Hoje',
    'generator.commission': 'Versículos de Comissão',
    'generator.help': 'Versículos de Ajuda',
    'generator.generate': 'Gerar Novos Versículos',
    'generator.connection': 'Perspectiva de Conexão',
    
    // Memorize Page
    'memorize.study': 'Estude Seu Versículo',
    'memorize.recite': 'Recite de Memória',
    'memorize.results': 'Seus Resultados',
    'memorize.tryAgain': 'Tentar Novamente',
    'memorize.newVerse': 'Novo Versículo',
    'memorize.checkAnswer': 'Verificar Minha Resposta',
    'memorize.startStudy': 'Iniciar Sessão de Estudo',
    
    // Settings
    'settings.title': 'Configurações',
    'settings.studyTime': 'Tempo de Estudo (segundos)',
    'settings.bibleVersion': 'Versão Bíblica Preferida',
    'settings.language': 'Idioma',
    'settings.uiLanguage': 'Idioma da Interface',
    'settings.bibleLanguage': 'Idioma da Bíblia',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.close': 'Fechar',
    'common.search': 'Buscar',
    'common.favorite': 'Favorito',
    'common.memorize': 'Memorizar',
    'common.accuracy': 'Precisão',
    'common.oldTestament': 'Antigo Testamento',
    'common.newTestament': 'Novo Testamento'
  },
  fr: {
    // Header
    'app.title': 'Bible Mémoire IA',
    'app.subtitle': 'Mémorisez les Écritures avec l\'assistance de l\'IA',
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
    'generator.generate': 'Générer de Nouveaux Versets',
    'generator.connection': 'Aperçu de Connexion',
    
    // Memorize Page
    'memorize.study': 'Étudiez Votre Verset',
    'memorize.recite': 'Récitez de Mémoire',
    'memorize.results': 'Vos Résultats',
    'memorize.tryAgain': 'Réessayer',
    'memorize.newVerse': 'Nouveau Verset',
    'memorize.checkAnswer': 'Vérifier Ma Réponse',
    'memorize.startStudy': 'Commencer la Session d\'Étude',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.studyTime': 'Temps d\'Étude (secondes)',
    'settings.bibleVersion': 'Version Biblique Préférée',
    'settings.language': 'Langue',
    'settings.uiLanguage': 'Langue de l\'Interface',
    'settings.bibleLanguage': 'Langue de la Bible',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.close': 'Fermer',
    'common.search': 'Rechercher',
    'common.favorite': 'Favori',
    'common.memorize': 'Mémoriser',
    'common.accuracy': 'Précision',
    'common.oldTestament': 'Ancien Testament',
    'common.newTestament': 'Nouveau Testament'
  }
};

export class TranslationService {
  private static currentLanguage = 'en';
  private static currentBibleLanguage = 'en';

  static setLanguage(languageCode: string) {
    this.currentLanguage = languageCode;
    localStorage.setItem('bibleMemoryUILanguage', languageCode);
  }

  static setBibleLanguage(languageCode: string) {
    this.currentBibleLanguage = languageCode;
    localStorage.setItem('bibleMemoryBibleLanguage', languageCode);
  }

  static getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  static getCurrentBibleLanguage(): string {
    return this.currentBibleLanguage;
  }

  static loadSavedLanguages() {
    const savedUILanguage = localStorage.getItem('bibleMemoryUILanguage');
    const savedBibleLanguage = localStorage.getItem('bibleMemoryBibleLanguage');
    
    if (savedUILanguage && supportedLanguages.find(l => l.code === savedUILanguage)) {
      this.currentLanguage = savedUILanguage;
    }
    
    if (savedBibleLanguage && supportedLanguages.find(l => l.code === savedBibleLanguage)) {
      this.currentBibleLanguage = savedBibleLanguage;
    }
  }

  static translate(key: string, fallback?: string): string {
    const translations = uiTranslations[this.currentLanguage] || uiTranslations['en'];
    return translations[key] || fallback || key;
  }

  static getBibleTranslationsForLanguage(languageCode: string): BibleTranslation[] {
    return bibleTranslations[languageCode] || [];
  }

  static getAvailableBibleLanguages(): Language[] {
    return supportedLanguages.filter(lang => lang.bibleSupported);
  }

  static getPopularLanguages(): Language[] {
    return supportedLanguages.filter(lang => lang.popular);
  }

  // Free translation API integration (using LibreTranslate or Google Translate free tier)
  static async translateText(text: string, targetLanguage: string, sourceLanguage = 'en'): Promise<string> {
    try {
      // Using LibreTranslate (free, open-source translation API)
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  // Bible verse translation using multiple APIs
  static async translateBibleVerse(verse: string, reference: string, targetLanguage: string): Promise<{ text: string; reference: string }> {
    try {
      // First try to get the verse in the target language from Bible APIs
      const translations = this.getBibleTranslationsForLanguage(targetLanguage);
      
      if (translations.length > 0) {
        // Use the first available translation for the language
        const translation = translations[0];
        
        // Here you would integrate with Bible Gateway API or similar
        // For now, we'll use text translation as fallback
        const translatedText = await this.translateText(verse, targetLanguage);
        const translatedReference = await this.translateText(reference, targetLanguage);
        
        return {
          text: translatedText,
          reference: translatedReference
        };
      }
      
      // Fallback to general text translation
      const translatedText = await this.translateText(verse, targetLanguage);
      const translatedReference = await this.translateText(reference, targetLanguage);
      
      return {
        text: translatedText,
        reference: translatedReference
      };
    } catch (error) {
      console.error('Bible verse translation error:', error);
      return { text: verse, reference }; // Return original if translation fails
    }
  }
}

// Initialize translation service
TranslationService.loadSavedLanguages();