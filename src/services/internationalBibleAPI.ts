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
        const { getPassageByReference } = await import('./BibleAPI');
        const passage = await getPassageByReference(version, reference);
        
        if (passage) {
          return {
            reference: passage.reference,
            text: passage.text,
            version: version,
            language: 'en',
            source: 'bible-api'
          };
        }
        return null;
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