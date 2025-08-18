import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Security helper functions
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

const isRateLimited = (clientIP: string): boolean => {
  const now = Date.now()
  const limit = rateLimitMap.get(clientIP)
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (5 requests per minute for verse generation)
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }
  
  if (limit.count >= 5) {
    return true
  }
  
  limit.count++
  return false
}

const validateRequest = (data: any): boolean => {
  return data && 
         ['commission', 'help'].includes(data.verseType) &&
         ['OT', 'NT'].includes(data.testament) &&
         (!data.bibleVersion || typeof data.bibleVersion === 'string')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req)
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      )
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { verseType, testament, bibleVersion } = await req.json()
    
    // Validate input data
    if (!validateRequest({ verseType, testament, bibleVersion })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Sanitize bible version input
    const sanitizedBibleVersion = bibleVersion ? bibleVersion.replace(/[<>]/g, '').trim() : 'King James Version'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 600,
        temperature: 0.7,
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
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response')
    }
    
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
    console.error('AI Verse Generator Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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