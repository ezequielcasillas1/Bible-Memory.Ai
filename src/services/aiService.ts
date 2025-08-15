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
      if (!response.ok && !data.fallback) {

      // Return fallback feedback if API key is not configured
      if (data.fallback) {
        return {
          feedback: data.feedback,
          suggestions: data.suggestions
        };
      }

      return data;
    } catch (error) {
      console.error('AI feedback failed:', error);
      // Fallback to static feedback
      return {
        feedback: accuracy >= 90 ? "Excellent work!" : accuracy >= 70 ? "Good job!" : "Keep practicing!",
      console.warn('AI feedback not available, using fallback');
      // Return fallback feedback when AI is not available
      return {
        feedback: "Great effort on your memorization! Keep practicing to improve your accuracy.",
        suggestions: [
          "Try breaking the verse into smaller chunks",
          "Practice reading the verse aloud several times", 
          "Focus on understanding the meaning to help with recall"
        ]
      };
    }
  }
}