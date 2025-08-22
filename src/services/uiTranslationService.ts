const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface UITranslationResult {
  translations: string[];
  targetLanguage: string;
  source: string;
  fallback?: boolean;
}

export class UITranslationService {
  private static cache = new Map<string, { translations: Record<string, string>; timestamp: number }>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async translateUITexts(
    texts: string[],
    targetLanguage: string
  ): Promise<UITranslationResult> {
    try {
      // Check cache first
      const cacheKey = `${targetLanguage}-${JSON.stringify(texts)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return {
          translations: texts.map(text => cached.translations[text] || text),
          targetLanguage,
          source: 'cache'
        };
      }

      // If target language is English, return original texts
      if (targetLanguage === 'en') {
        return {
          translations: texts,
          targetLanguage: 'en',
          source: 'original'
        };
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ui-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          texts,
          targetLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const result = await response.json();

      // Cache successful translations
      if (result.translations && !result.fallback) {
        const translationMap: Record<string, string> = {};
        texts.forEach((text, index) => {
          translationMap[text] = result.translations[index] || text;
        });

        this.cache.set(cacheKey, {
          translations: translationMap,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('UI translation failed:', error);
      // Return original texts as fallback
      return {
        translations: texts,
        targetLanguage,
        source: 'fallback',
        fallback: true
      };
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}