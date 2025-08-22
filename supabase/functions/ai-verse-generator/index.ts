import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced security constants
const MAX_TOKENS = 600
const MAX_INPUT_LENGTH = 500
const ALLOWED_MODELS = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']

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
         (!data.bibleVersion || (typeof data.bibleVersion === 'string' && data.bibleVersion.length <= 100))
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
    .substring(0, MAX_INPUT_LENGTH)
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
    
    // Additional security checks
    if (JSON.stringify({ verseType, testament, bibleVersion }).length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { 
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    // Validate API key format (basic check)
    if (!openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      console.error('Invalid OpenAI API key format')
      throw new Error('OpenAI API configuration error')
    }

    // Enhanced input sanitization
    const sanitizedBibleVersion = bibleVersion ? sanitizeInput(bibleVersion) : 'King James Version'
    const sanitizedVerseType = sanitizeInput(verseType)
    const sanitizedTestament = sanitizeInput(testament)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Bible-Memory-AI/1.0',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        messages: [
          {
            role: 'system',
            content: `You are a Bible scholar and memorization expert. Generate meaningful, well-known Bible verses that are excellent for memorization. You must only respond with valid JSON. Focus on verses that are:
            1. Theologically significant
            2. Practically applicable to daily life
            3. Memorable and quotable
            4. Appropriate length for memorization (not too long)
            5. Well-known and beloved by Christians
            
            CRITICAL: You must respond ONLY with valid JSON. Do not include any text before or after the JSON.`
          },
          {
            role: 'user',
            content: `Generate a ${sanitizedTestament === 'OT' ? 'Old Testament' : 'New Testament'} verse perfect for memorization that serves as a ${sanitizedVerseType === 'commission' ? 'commission/encouragement verse - something that builds faith, provides hope, or encourages believers in their spiritual journey' : 'help/comfort verse - something that provides comfort, strength, or guidance during difficult times'}.

Requirements:
- Choose a well-known, beloved verse
- Verse should be 1-3 verses long (good for memorization)
- Must be from the ${sanitizedTestament === 'OT' ? 'Old Testament' : 'New Testament'}
- Response must be valid JSON only

Provide detailed explanation of:
1. Why this verse is meaningful for ${sanitizedVerseType === 'commission' ? 'encouraging believers' : 'helping people in difficult times'}
2. Historical/theological context
3. Practical application for daily life
4. Memory techniques that could help with this specific verse

Return ONLY this JSON format:
{
  "text": "exact verse text from ${sanitizedBibleVersion || 'KJV'}",
  "reference": "Book Chapter:Verse",
  "reason": "Detailed explanation of why this verse is meaningful and applicable",
  "context": "Brief historical/theological context",
  "application": "How this verse applies to daily Christian life",
  "memoryTips": "Specific techniques for memorizing this particular verse",
  "version": "${sanitizedBibleVersion || 'KJV'}"
}`
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response')
    }
    
    let verseData
    try {
      const content = data.choices[0].message.content.trim()
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      verseData = JSON.parse(cleanContent)
      
      // Validate response structure
      if (!verseData.text || !verseData.reference || !verseData.reason) {
        throw new Error('Invalid response structure from OpenAI')
      }
      
      // Sanitize response data
      verseData.text = sanitizeInput(verseData.text || '')
      verseData.reference = sanitizeInput(verseData.reference || '')
      verseData.reason = sanitizeInput(verseData.reason || '')
      verseData.context = sanitizeInput(verseData.context || '')
      verseData.application = sanitizeInput(verseData.application || '')
      verseData.memoryTips = sanitizeInput(verseData.memoryTips || '')
      verseData.version = sanitizeInput(verseData.version || 'KJV')
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }

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