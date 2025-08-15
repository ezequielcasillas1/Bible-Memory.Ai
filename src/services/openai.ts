import OpenAI from 'openai';
import { BibleApiService } from './bibleApi';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface VerseResponse {
  oldTestament: {
    text: string;
    reference: string;
    reason: string;
  };
  newTestament: {
    text: string;
    reference: string;
    reason: string;
  };
  connection: string;
}

export interface ImprovementSuggestion {
  suggestion: string;
  reason: string;
}

export class OpenAIService {
  static async generateVerses(type: 'commission' | 'help', bibleVersion?: string): Promise<VerseResponse> {
    // Check if API key is available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using fallback data');
      return this.getFallbackVerses(type);
    }

    // First, try to get real Bible verses from the API
    try {
      const verse1 = await BibleApiService.getRandomVerse(type, bibleVersion);
      const verse2 = await BibleApiService.getRandomVerse(type, bibleVersion);
      
      // Convert to our format
      const otVerse = BibleApiService.getTestament(verse1.verses?.[0]?.book_name || '') === 'OT' ? verse1 : verse2;
      const ntVerse = BibleApiService.getTestament(verse1.verses?.[0]?.book_name || '') === 'NT' ? verse1 : verse2;
      
      // If we don't have both OT and NT, get another verse
      let finalOtVerse = otVerse;
      let finalNtVerse = ntVerse;
      
      if (BibleApiService.getTestament(otVerse.verses?.[0]?.book_name || '') !== 'OT') {
        // Try to get an OT verse
        const otVerseRefs = type === 'commission' 
          ? ['Isaiah 53:6', 'Jeremiah 29:11', 'Psalm 23:1', 'Proverbs 3:5-6', 'Isaiah 41:10']
          : ['Psalm 23:4', 'Isaiah 41:10', 'Psalm 55:22', 'Joshua 1:9', 'Psalm 46:1'];
        const randomOtRef = otVerseRefs[Math.floor(Math.random() * otVerseRefs.length)];
        finalOtVerse = await BibleApiService.getVerse(randomOtRef, bibleVersion);
      }
      
      if (BibleApiService.getTestament(ntVerse.verses?.[0]?.book_name || '') !== 'NT') {
        // Try to get an NT verse
        const ntVerseRefs = type === 'commission'
          ? ['John 3:16', 'Romans 6:23', 'Romans 10:9', 'Ephesians 2:8-9', 'John 14:6']
          : ['Matthew 11:28-30', '1 Peter 5:7', 'Philippians 4:13', '2 Corinthians 12:9', 'Hebrews 13:5'];
        const randomNtRef = ntVerseRefs[Math.floor(Math.random() * ntVerseRefs.length)];
        finalNtVerse = await BibleApiService.getVerse(randomNtRef, bibleVersion);
      }
      
      // Now generate AI reasons for these real verses
      const reasonPrompt = type === 'commission' 
        ? `For these two Bible verses, provide compelling reasons why they encourage someone to accept Christ and follow Christianity:

Old Testament: "${finalOtVerse.text}" (${BibleApiService.formatReference(finalOtVerse)})
New Testament: "${finalNtVerse.text}" (${BibleApiService.formatReference(finalNtVerse)})

Focus on verses that show:
- Benefits of following Christ (eternal life, forgiveness, peace, transformation)
- The nature and goodness of God (love, mercy, justice, faithfulness)
- Consequences of rejecting Christ (judgment, separation from God)
- Human need for salvation (sin, brokenness, inability to save oneself)
- Hope and assurance (God's promises, joy, belonging, purpose)

Return in this exact JSON format:
{
  "oldTestament": {
    "reason": "Brief explanation of why this verse encourages conversion to Christianity"
  },
  "newTestament": {
    "reason": "Brief explanation of why this verse encourages conversion to Christianity"
  },
  "connection": "Brief explanation of how these verses work together to show compelling reasons to follow Christ"
}`
        : `For these two Bible verses, explain how they offer comfort, help, and encouragement to people in difficult times:

Old Testament: "${finalOtVerse.text}" (${BibleApiService.formatReference(finalOtVerse)})
New Testament: "${finalNtVerse.text}" (${BibleApiService.formatReference(finalNtVerse)})

Return in this exact JSON format:
{
  "oldTestament": {
    "reason": "Brief explanation of how this verse provides help and comfort"
  },
  "newTestament": {
    "reason": "Brief explanation of how this verse provides help and comfort"
  },
  "connection": "Brief explanation of how these verses work together to provide comfort and help"
}`;

      const reasonResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a biblical scholar who provides insightful explanations of Bible verses. Always return valid JSON format."
          },
          {
            role: "user",
            content: reasonPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const reasonContent = reasonResponse.choices[0]?.message?.content;
      if (reasonContent) {
        const reasons = JSON.parse(reasonContent);
        
        return {
          oldTestament: {
            text: finalOtVerse.text.replace(/\s+/g, ' ').trim(),
            reference: BibleApiService.formatReference(finalOtVerse),
            reason: reasons.oldTestament.reason
          },
          newTestament: {
            text: finalNtVerse.text.replace(/\s+/g, ' ').trim(),
            reference: BibleApiService.formatReference(finalNtVerse),
            reason: reasons.newTestament.reason
          },
          connection: reasons.connection
        };
      }
    } catch (error) {
      console.error('Error using Bible API, falling back to AI generation:', error);
    }

    // Fallback to original AI-only generation if Bible API fails
    const prompt = type === 'commission' 
      ? `Generate two Bible verses (one from Old Testament, one from New Testament) that give compelling reasons for someone to accept Christ and follow Christianity. Focus on verses that show:

- Benefits of following Christ (eternal life, forgiveness, peace, transformation)
- The nature and goodness of God (love, mercy, justice, faithfulness)
- Consequences of rejecting Christ (judgment, separation from God)
- Human need for salvation (sin, brokenness, inability to save oneself)
- Hope and assurance (God's promises, joy, belonging, purpose)

DO NOT include verses that only tell people to go and preach unless paired with reason-focused content.

Return in this exact JSON format:
{
  "oldTestament": {
    "text": "exact verse text",
    "reference": "Book Chapter:Verse",
    "reason": "Brief explanation of why this verse encourages conversion to Christianity"
  },
  "newTestament": {
    "text": "exact verse text", 
    "reference": "Book Chapter:Verse",
    "reason": "Brief explanation of why this verse encourages conversion to Christianity"
  },
  "connection": "Brief explanation of how these verses work together to show compelling reasons to follow Christ"
}`
      : `Generate two Bible verses (one from Old Testament, one from New Testament) that offer comfort, help, and encouragement to people in difficult times. Include themes like God's care, comfort in trials, strength in weakness, or hope in despair.

Return in this exact JSON format:
{
  "oldTestament": {
    "text": "exact verse text",
    "reference": "Book Chapter:Verse"
    "reason": "Brief explanation of how this verse provides help and comfort"
  },
  "newTestament": {
    "text": "exact verse text",
    "reference": "Book Chapter:Verse",
    "reason": "Brief explanation of how this verse provides help and comfort"
  },
  "connection": "Brief explanation of how these verses work together to provide comfort and help"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a biblical scholar who provides accurate Bible verses with exact references. Always return valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating verses:', error);
      return this.getFallbackVerses(type);
    }
  }

  private static getFallbackVerses(type: 'commission' | 'help'): VerseResponse {
    return type === 'commission' ? {
        oldTestament: {
          text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
          reference: "Jeremiah 29:11",
          reason: "Shows God's loving intentions and promises a hopeful future for those who trust Him."
        },
        newTestament: {
          text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
          reference: "John 3:16",
          reason: "Demonstrates God's incredible love and offers the promise of eternal life through faith in Christ."
        },
        connection: "These verses reveal God's heart of love and His desire to give believers hope, purpose, and eternal life."
      } : {
        oldTestament: {
          text: "Cast your burden on the Lord, and he will sustain you; he will never permit the righteous to be moved.",
          reference: "Psalm 55:22",
          reason: "Assures us that God will support and sustain those who trust Him with their troubles."
        },
        newTestament: {
          text: "Come to me, all who labor and are heavy laden, and I will give you rest.",
          reference: "Matthew 11:28",
          reason: "Jesus personally invites those who are struggling to find rest and peace in Him."
        },
        connection: "These verses work together to show that God cares deeply about our struggles and offers genuine rest and support."
      };
  }

  static async generateImprovementSuggestions(userStats: {
    totalPoints: number;
    versesMemorized: number;
    averageAccuracy: number;
    currentStreak: number;
  }): Promise<ImprovementSuggestion[]> {
    const prompt = `Based on these Bible memorization stats, provide 3 personalized improvement suggestions:
- Total Points: ${userStats.totalPoints}
- Verses Memorized: ${userStats.versesMemorized}
- Average Accuracy: ${userStats.averageAccuracy}%
- Current Streak: ${userStats.currentStreak} days

Return in this exact JSON format:
[
  {
    "suggestion": "specific actionable suggestion",
    "reason": "brief explanation why this helps"
  },
  {
    "suggestion": "specific actionable suggestion", 
    "reason": "brief explanation why this helps"
  },
  {
    "suggestion": "specific actionable suggestion",
    "reason": "brief explanation why this helps"
  }
]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a Bible memorization coach who provides personalized, encouraging advice to help people improve their Scripture memory skills."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      return [
        {
          suggestion: "Focus on longer verses to build endurance and deepen understanding",
          reason: "Longer passages help develop sustained concentration and reveal more context"
        },
        {
          suggestion: "Practice verses from different Bible books to broaden your knowledge",
          reason: "Variety helps prevent monotony and exposes you to different writing styles"
        },
        {
          suggestion: "Review previously memorized verses weekly to maintain long-term retention",
          reason: "Regular review strengthens neural pathways and prevents forgetting"
        }
      ];
    }
  }

  static async analyzeMemorizationAccuracy(userInput: string, originalVerse: string): Promise<{
    accuracy: number;
    feedback: string;
    suggestions: string[];
  }> {
    const prompt = `Compare this user's verse recitation with the original Bible verse and provide detailed feedback:

Original verse: "${originalVerse}"
User's recitation: "${userInput}"

Analyze the accuracy and provide constructive feedback. Return in this exact JSON format:
{
  "accuracy": number_between_0_and_100,
  "feedback": "encouraging feedback about their performance",
  "suggestions": ["specific tip 1", "specific tip 2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an encouraging Bible memorization tutor who provides accurate assessment and helpful feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing accuracy:', error);
      // Fallback to basic word comparison
      const accuracy = this.calculateBasicAccuracy(userInput, originalVerse);
      return {
        accuracy,
        feedback: accuracy >= 90 ? "Excellent work! You nailed it!" : 
                 accuracy >= 70 ? "Good job! Keep practicing!" : 
                 "Good effort! Practice makes perfect!",
        suggestions: ["Try reading the verse aloud several times", "Focus on key phrases and their meaning"]
      };
    }
  }

  static async chatResponse(prompt: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an encouraging Bible memorization coach. Provide helpful, specific advice about Scripture memory techniques, motivation, and spiritual growth. Keep responses concise but encouraging."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Error getting chat response:', error);
      return "I'm here to help with your Bible memorization journey! Try asking about specific techniques, motivation tips, or how to improve your accuracy.";
    }
  }

  private static calculateBasicAccuracy(input: string, original: string): number {
    const inputWords = input.toLowerCase().trim().split(/\s+/);
    const originalWords = original.toLowerCase().trim().split(/\s+/);
    
    let matches = 0;
    const maxLength = Math.max(inputWords.length, originalWords.length);
    
    for (let i = 0; i < Math.min(inputWords.length, originalWords.length); i++) {
      if (inputWords[i] === originalWords[i]) {
        matches++;
      }
    }
    
    return Math.round((matches / maxLength) * 100);
  }
}