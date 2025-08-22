const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  reference?: string;
  sourceVersion: string;
  targetLanguage: string;
  targetLanguageCode: string;
  strategy: string;
  isRecommendedPairing: boolean;
  recommendation: string;
  strategyNote: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  strategy: 'romance_germanic' | 'asian_african' | 'missionary_global';
  recommended: string[];
  description: string;
}

// Strategic language pairings for optimal translation accuracy
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  // Romance & Germanic languages - best with formal translations
  {
    code: 'es',
    name: 'Spanish',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Formal English translations work best due to similar grammar structures'
  },
  {
    code: 'fr',
    name: 'French',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Classical translations maintain theological precision'
  },
  {
    code: 'de',
    name: 'German',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Formal structure aligns well with German theological tradition'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Romance language structure supports formal translation style'
  },
  {
    code: 'it',
    name: 'Italian',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Classical translations resonate with Italian theological heritage'
  },
  {
    code: 'nl',
    name: 'Dutch',
    strategy: 'romance_germanic',
    recommended: ['kjv', 'asv', 'darby'],
    description: 'Germanic structure supports traditional translation approaches'
  },

  // Asian & African languages - best with simplified English
  {
    code: 'zh-cn',
    name: 'Chinese (Simplified)',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Simplified English reduces complexity and theological distortion'
  },
  {
    code: 'zh-tw',
    name: 'Chinese (Traditional)',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Clear, simple English translates more accurately to Chinese'
  },
  {
    code: 'ja',
    name: 'Japanese',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Basic English avoids complex idioms that don\'t translate well'
  },
  {
    code: 'ko',
    name: 'Korean',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Simplified vocabulary ensures clearer theological meaning'
  },
  {
    code: 'sw',
    name: 'Swahili',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Plain English works best for African language structures'
  },
  {
    code: 'hi',
    name: 'Hindi',
    strategy: 'asian_african',
    recommended: ['bbe', 'oeb-us'],
    description: 'Simple English reduces cultural and linguistic barriers'
  },

  // Missionary/Global languages - best with modern clear English
  {
    code: 'tl',
    name: 'Tagalog',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Modern English optimized for growing Christian communities'
  },
  {
    code: 'zu',
    name: 'Zulu',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Contemporary language for active missionary contexts'
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Clear, modern English for Southeast Asian readership'
  },
  {
    code: 'th',
    name: 'Thai',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Accessible English for Buddhist-majority context'
  },
  {
    code: 'ms',
    name: 'Malay',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Modern translation approach for Muslim-majority regions'
  },
  {
    code: 'id',
    name: 'Indonesian',
    strategy: 'missionary_global',
    recommended: ['webbe', 'oeb-us'],
    description: 'Contemporary English for world\'s largest archipelago nation'
  }
];

export class TranslationService {
  static async translateVerse(
    text: string,
    targetLanguage: string,
    sourceVersion: string,
    reference?: string
  ): Promise<TranslationResult> {
    try {
      // Ensure we're sending the complete verse text without any truncation
      const fullText = text.trim()
      
      if (!fullText) {
        throw new Error('No text provided for translation')
      }
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: fullText, // Send complete verse text
          targetLanguage,
          sourceVersion,
          reference
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Translation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Translation service error:', error);
      throw new Error(`Translation service error: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
    }
  }

  static getLanguagesByStrategy(strategy: string): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES.filter(lang => lang.strategy === strategy);
  }

  static getRecommendedVersions(languageCode: string): string[] {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language ? language.recommended : [];
  }

  static isRecommendedPairing(sourceVersion: string, targetLanguage: string): boolean {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    return language ? language.recommended.includes(sourceVersion) : false;
  }

  static getLanguageInfo(languageCode: string): SupportedLanguage | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  }
}