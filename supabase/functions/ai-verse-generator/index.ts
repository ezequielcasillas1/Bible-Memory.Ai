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
    const { verseType, testament, bibleVersion } = await req.json()
    
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
            content: `You are a Bible scholar and memorization expert. Generate meaningful, well-known Bible verses that are excellent for memorization. Focus on verses that are:
            1. Theologically significant
            2. Practically applicable to daily life
            3. Memorable and quotable
            4. Appropriate length for memorization (not too long)
            5. Well-known and beloved by Christians`
          },
          {
            role: 'user',
            content: `Generate a ${testament === 'OT' ? 'Old Testament' : 'New Testament'} verse perfect for memorization that serves as a ${verseType === 'commission' ? 'commission/encouragement verse - something that builds faith, provides hope, or encourages believers in their spiritual journey' : 'help/comfort verse - something that provides comfort, strength, or guidance during difficult times'}.

Requirements:
- Use ${bibleVersion || 'King James Version'} translation
- Choose a well-known, beloved verse
- Verse should be 1-3 verses long (good for memorization)
- Must be from the ${testament === 'OT' ? 'Old Testament' : 'New Testament'}

Provide detailed explanation of:
1. Why this verse is meaningful for ${verseType === 'commission' ? 'encouraging believers' : 'helping people in difficult times'}
2. Historical/theological context
3. Practical application for daily life
4. Memory techniques that could help with this specific verse

Return JSON format:
{
  "text": "exact verse text from ${bibleVersion || 'KJV'}",
  "reference": "Book Chapter:Verse",
  "reason": "Detailed explanation of why this verse is meaningful and applicable",
  "context": "Brief historical/theological context",
  "application": "How this verse applies to daily Christian life",
  "memoryTips": "Specific techniques for memorizing this particular verse",
  "version": "${bibleVersion || 'KJV'}"
}`
          }
        ],
        max_tokens: 600,
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