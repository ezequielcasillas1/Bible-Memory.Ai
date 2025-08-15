import { Verse, UserStats } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
      };
    } catch (error) {
      console.error('AI verse generation failed:', error);
      // Fallback to static verses if AI fails
      throw new Error('AI service temporarily unavailable');
    }
  }

  static async getPersonalizedFeedback(
    userInput: string,
    originalVerse: string,
    accuracy: number,
    userStats: UserStats
  ): Promise<{ feedback: string; suggestions: string[] }> {
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

      return await response.json();
    } catch (error) {
      console.error('AI feedback failed:', error);
      // Fallback to static feedback
      return {
        feedback: accuracy >= 90 ? "Excellent work!" : accuracy >= 70 ? "Good job!" : "Keep practicing!",
        suggestions: ["Try reading the verse aloud", "Break it into smaller chunks", "Practice daily for better retention"]
      };
    }
  }
}