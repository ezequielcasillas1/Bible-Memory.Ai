import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userInput, originalVerse, accuracy, userStats } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          fallback: true,
          feedback: "Great effort on your memorization! Keep practicing to improve your accuracy.",
          suggestions: [
            "Try breaking the verse into smaller chunks",
            "Practice reading the verse aloud several times",
            "Focus on understanding the meaning to help with recall"
          ]
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert Bible memorization coach with deep knowledge of Scripture and proven memorization techniques. You provide detailed, personalized feedback that combines spiritual encouragement with practical memorization strategies. Your responses should be warm, encouraging, and actionable.`
          },
          {
            role: 'user',
            content: `MEMORIZATION ATTEMPT ANALYSIS:

Original Verse: "${originalVerse}"
User's Attempt: "${userInput}"
Accuracy Score: ${accuracy}%

USER PROGRESS CONTEXT:
- Total verses memorized: ${userStats.versesMemorized}
- Current streak: ${userStats.currentStreak} days
- Average accuracy: ${Math.round(userStats.averageAccuracy)}%
- Experience level: ${userStats.versesMemorized < 5 ? 'Beginner' : userStats.versesMemorized < 20 ? 'Intermediate' : 'Advanced'}

PROVIDE COMPREHENSIVE FEEDBACK INCLUDING:

1. PERSONALIZED ENCOURAGEMENT: Reference their progress, streak, and improvement
2. SPECIFIC ANALYSIS: What they got right, what needs work
3. MEMORIZATION STRATEGIES: 4-5 detailed, actionable techniques
4. SPIRITUAL INSIGHT: Brief reflection on the verse's meaning to aid retention
5. NEXT STEPS: Specific practice recommendations

Return JSON format:
{
  "feedback": "Detailed encouraging message that acknowledges their specific progress and effort",
  "analysis": "Specific analysis of what they got right and what needs improvement",
  "strategies": [
    "Detailed memorization technique 1",
    "Detailed memorization technique 2", 
    "Detailed memorization technique 3",
    "Detailed memorization technique 4"
  ],
  "spiritualInsight": "Brief insight about the verse's meaning to help with understanding and retention",
  "nextSteps": "Specific recommendations for their next practice session",
  "encouragement": "Final motivational message"
}`
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    const feedbackData = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(feedbackData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})