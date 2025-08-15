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
      throw new Error('OpenAI API key not configured')
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
            content: `You are a Bible memorization coach. Provide encouraging, specific feedback to help users improve their Scripture memorization.`
          },
          {
            role: 'user',
            content: `User attempted to memorize: "${originalVerse}"
            
            Their attempt: "${userInput}"
            Accuracy: ${accuracy}%
            
            User stats: ${userStats.versesMemorized} verses memorized, ${userStats.currentStreak} day streak, ${Math.round(userStats.averageAccuracy)}% average accuracy.
            
            Provide personalized feedback and 2-3 specific improvement suggestions. Be encouraging and reference their progress.
            
            Return JSON format:
            {
              "feedback": "encouraging message",
              "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
            }`
          }
        ],
        max_tokens: 250,
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