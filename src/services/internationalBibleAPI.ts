// International Bible API service for multi-language Bible content
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface InternationalBibleVerse {
  reference: string;
  text: string;
  version: string;
  language: string;
  source: string;
}

export class InternationalBibleAPI {
  static async getVerse(reference: string, version: string, language: string): Promise<InternationalBibleVerse | null> {
    try {
      // For English, use our existing Bible API
      if (language === 'en') {
        // Direct fallback for English to avoid recursion
        try {
          const response = await fetch('https://bible-api.com/' + reference.toLowerCase().replace(/\s+/g, '+') + '?translation=' + version);
          if (response.ok) {
            const data = await response.json();
            return {
              reference: data.reference,
              text: data.text,
              version: version,
              language: 'en',
              source: 'direct-bible-api'
            };
          }
        } catch (directError) {
          console.warn('Direct Bible API failed:', directError);
        }
        
        // Final fallback to static content
        return {
          reference: 'John 3:16',
          text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
          version: version,
          language: 'en',
          source: 'static-fallback'
        };
      }

      // For other languages, use Bible Gateway API through our Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/bible-gateway-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          reference,
          version,
          language,
          action: 'getVerse'
        }),
      });

      if (!response.ok) {
        throw new Error(`International Bible API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.fallback) {
        // If the API failed, try to translate English version
        const { TranslationService } = await import('./translationService');
        const englishVerse = await this.getVerse(reference, 'kjv', 'en');
        
        if (englishVerse) {
          const translatedVerse = await TranslationService.translateBibleVerse(
            englishVerse.text,
            englishVerse.reference,
            language
          );
          
          return {
            reference: translatedVerse.reference,
            text: translatedVerse.text,
            version: `${version} (Translated)`,
            language,
            source: 'translation'
          };
        }
      }

      return data;
    } catch (error) {
      console.error('International Bible API error:', error);
      
      // Final fallback: translate from English
      try {
        const { TranslationService } = await import('./translationService');
        const englishVerse = await this.getVerse(reference, 'kjv', 'en');
        
        if (englishVerse) {
          const translatedVerse = await TranslationService.translateBibleVerse(
            englishVerse.text,
            englishVerse.reference,
            language
          );
          
          return {
            reference: translatedVerse.reference,
            text: translatedVerse.text,
            version: `KJV (Translated to ${language})`,
            language,
            source: 'fallback-translation'
          };
        }
      } catch (translationError) {
        console.error('Translation fallback failed:', translationError);
      }
      
      return null;
    }
  }

  static async searchVerses(query: string, version: string, language: string): Promise<InternationalBibleVerse[]> {
    try {
      // For English, use existing search
      if (language === 'en') {
        const { searchVerses } = await import('./BibleAPI');
        const results = await searchVerses(query, version);
        
        return results.map(result => ({
          reference: result.reference,
          text: result.text,
          version: version,
          language: 'en',
          source: 'bible-api'
        }));
      }

      // For other languages, search in English then translate
      const englishResults = await this.searchVerses(query, 'kjv', 'en');
      const { TranslationService } = await import('./translationService');
      
      const translatedResults = await Promise.all(
        englishResults.slice(0, 5).map(async (verse) => {
          try {
            const translated = await TranslationService.translateBibleVerse(
              verse.text,
              verse.reference,
              language
            );
            
            return {
              reference: translated.reference,
              text: translated.text,
              version: `${version} (Translated)`,
              language,
              source: 'translation'
            };
          } catch (error) {
            return verse; // Return original if translation fails
          }
        })
      );

      return translatedResults;
    } catch (error) {
      console.error('International Bible search error:', error);
      return [];
    }
  }
}