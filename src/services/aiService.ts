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
}