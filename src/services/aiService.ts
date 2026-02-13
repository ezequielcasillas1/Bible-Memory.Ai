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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:getWordHint',message:'getWordHint called',data:{word,supabaseUrl:SUPABASE_URL,hasAnonKey:!!import.meta.env.VITE_SUPABASE_ANON_KEY},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    try {
      const url = `${SUPABASE_URL}/functions/v1/ai-word-hint`;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:fetch',message:'Fetching edge function',data:{url},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ word, verseText, verseReference }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:response',message:'Edge function response',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errBody = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:errorBody',message:'Edge function error body',data:{status:response.status,errBody:errBody.substring(0,500)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        throw new Error('Failed to get word hint');
      }

      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:parsed',message:'Parsed hint data',data:{keys:Object.keys(data),hasSoundsLike:!!data.soundsLike,hasVerseClue:!!data.verseClue,fallback:data.fallback},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      return data as WordHintData;
    } catch (error) {
      console.error('AI word hint failed:', error);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/042add78-b658-4104-af04-a421d00cd193',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.ts:catch',message:'getWordHint caught error',data:{error:String(error)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return {
        soundsLike: "Try sounding the word out syllable by syllable, or think of words that rhyme.",
        modernEquivalent: "Think about what modern word you would use in this spot in the verse.",
        memoryTrick: "Close your eyes and picture yourself reading this verse aloud — what word fits?",
        verseClue: `Look at the words before and after the blank in ${verseReference || 'the verse'} for context clues.`,
        synonyms: [],
        fallback: true,
      };
    }
  }
}