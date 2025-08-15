import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { verseType, testament } = await req.json()
    
    // Get OpenAI API key from Supabase secrets (set via dashboard)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Call OpenAI API
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
            content: `You are a Bible verse expert. Generate meaningful Bible verses for memorization.`
          },
          {
            role: 'user',
            content: `Generate a ${testament} ${verseType} verse with reference and explanation of why it's meaningful for ${verseType === 'commission' ? 'encouraging believers in their faith journey' : 'helping people in difficult times'}.

            Return JSON format:
            {
              "text": "verse text",
              "reference": "Book Chapter:Verse",
              "reason": "explanation of why this verse is meaningful"
            }`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const verseData = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(verseData),
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