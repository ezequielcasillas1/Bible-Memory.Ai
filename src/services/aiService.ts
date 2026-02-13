import { Verse, UserStats } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface WordHintData {
  soundsLike: string;
  modernEquivalent: string;
  memoryTrick: string;
  verseClue: string;
  synonyms: string[];
  fallback?: boolean;
}

export class AIService {
  static async generateVerse(verseType: 'commission' | 'help', testament: 'OT' | 'NT', bibleVersion?: string): Promise<Verse> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-verse-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ verseType, testament, bibleVersion }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate verse');
      }

      const verseData = await response.json();
      
      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: verseData.text,
        reference: verseData.reference,
        testament,
        reason: verseData.reason,
        version: verseData.version || bibleVersion,
        context: verseData.context,
        application: verseData.application,
        memoryTips: verseData.memoryTips
      };
    } catch (error) {
      console.error('AI verse generation failed:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  static async getPersonalizedFeedback(
    userInput: string,
    originalVerse: string,
    accuracy: number,
    userStats: UserStats
  ): Promise<{
    feedback: string;
    analysis: string;
    strategies: string[];
    spiritualInsight: string;
    nextSteps: string;
    encouragement: string;
  }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userInput, originalVerse, accuracy, userStats }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI feedback');
      }

      const data = await response.json();

      // Return fallback feedback if API key is not configured
      if (data.fallback) {
        return {
          feedback: data.feedback,
          analysis: "Keep practicing to improve your accuracy!",
          strategies: data.suggestions,
          spiritualInsight: "Focus on understanding the verse's meaning to help with memorization.",
          nextSteps: "Try practicing this verse again tomorrow.",
          encouragement: "You're making great progress!"
        };
      }

      return data;
    } catch (error) {
      console.error('AI feedback failed:', error);
      // Fallback to static feedback
      return {
        feedback: "Great effort on your memorization! Keep practicing to improve your accuracy.",
        analysis: "Focus on the areas where you had difficulty and try breaking the verse into smaller parts.",
        strategies: [
          "Break the verse into smaller chunks and memorize piece by piece",
          "Practice reading the verse aloud several times before memorizing",
          "Focus on understanding the meaning to help with recall",
          "Use visualization techniques to create mental images of key words"
        ],
        spiritualInsight: "Understanding the deeper meaning of Scripture helps with both memorization and spiritual growth.",
        nextSteps: "Practice this verse again tomorrow, focusing on the parts you found most challenging.",
        encouragement: "Every verse you memorize is treasure stored in your heart. Keep going!"
      };
    }
  }

  static async getWordHint(
    word: string,
    verseText: string,
    verseReference?: string
  ): Promise<WordHintData> {
    try {
      const url = `${SUPABASE_URL}/functions/v1/ai-word-hint`;

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint:entry',message:'getWordHint called',data:{word,verseReference,supabaseUrl:SUPABASE_URL?'SET':'MISSING',anonKey:import.meta.env.VITE_SUPABASE_ANON_KEY?'SET':'MISSING',fullUrl:url},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion

      if (!SUPABASE_URL) {
        console.error('AI word hint: VITE_SUPABASE_URL is not configured');
        return AIService.buildLocalHints(word, verseText, verseReference);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ word, verseText, verseReference }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint:response',message:'Edge function responded',data:{status:response.status,ok:response.ok,statusText:response.statusText,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'no body');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint:errorBody',message:'Non-OK response body',data:{status:response.status,errorBody},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
        // #endregion
        console.error(`AI word hint failed [${response.status}]:`, errorBody);
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint:data',message:'Parsed response data',data:{fallback:data.fallback,error:data.error,hasSoundsLike:!!data.soundsLike,hasVerseClue:!!data.verseClue},timestamp:Date.now(),hypothesisId:'H1-H3'})}).catch(()=>{});
      // #endregion
      // If edge function returned its own fallback, log the reason for debugging
      if (data.fallback) {
        console.warn('AI word hint: edge function returned fallback.', data.error || 'API key may be missing');
      }
      return data as WordHintData;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint:catch',message:'Fetch failed completely',data:{errorType:(error as any)?.constructor?.name,errorMessage:(error as any)?.message},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion
      console.error('AI word hint failed:', error);
      return AIService.buildLocalHints(word, verseText, verseReference);
    }
  }

  /** Generate contextual hints locally when AI is unavailable */
  private static buildLocalHints(
    word: string,
    verseText: string,
    verseReference?: string
  ): WordHintData {
    const len = word.length;
    const firstLetter = word.charAt(0).toUpperCase();
    const lastLetter = word.charAt(word.length - 1).toLowerCase();

    // Find surrounding words in the verse
    const verseWords = verseText.split(/\s+/);
    const wordIdx = verseWords.findIndex(
      w => w.toLowerCase().replace(/[^a-z]/g, '') === word.toLowerCase()
    );
    const before = wordIdx > 0 ? verseWords[wordIdx - 1] : '';
    const after = wordIdx >= 0 && wordIdx < verseWords.length - 1 ? verseWords[wordIdx + 1] : '';

    // Rough syllable count
    const syllables = Math.max(1,
      (word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, '').match(/[aeiouy]{1,2}/gi) || []).length
    );

    return {
      soundsLike: `This ${len}-letter word starts with "${firstLetter}" and ends with "${lastLetter}". It has about ${syllables} syllable${syllables > 1 ? 's' : ''}.`,
      verseClue: before && after
        ? `In ${verseReference || 'this verse'}, this word appears between "${before}" and "${after}".`
        : `Look at the words surrounding the blank in ${verseReference || 'this verse'} for context.`,
      modernEquivalent: `Think about what ${syllables > 2 ? 'longer' : 'short'} modern word starting with "${firstLetter}" would fit the meaning here.`,
      memoryTrick: `Picture the verse in your mind — after "${before || '...'}", what ${len}-letter word starting with "${firstLetter}" comes next?`,
      synonyms: [],
      fallback: true,
    };
  }
}