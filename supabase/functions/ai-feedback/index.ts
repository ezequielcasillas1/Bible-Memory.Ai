import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced security constants
const MAX_TOKENS = 800
const MAX_INPUT_LENGTH = 1000
const ALLOWED_MODELS = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']

// Rate limiting storage (in production, use Redis or similar)
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
    // Reset or create new limit (10 requests per minute)
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }
  
  if (limit.count >= 10) {
    return true
  }
  
  limit.count++
  return false
}

const validateRequest = (data: any): boolean => {
  return data && 
         typeof data.userInput === 'string' && 
         typeof data.originalVerse === 'string' && 
         typeof data.accuracy === 'number' &&
         data.userInput.length <= MAX_INPUT_LENGTH &&
         data.originalVerse.length <= MAX_INPUT_LENGTH &&
         data.accuracy >= 0 && data.accuracy <= 100
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+=/gi, '')
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

    const { userInput, originalVerse, accuracy, userStats } = await req.json()
    
    // Validate input data
    if (!validateRequest({ userInput, originalVerse, accuracy, userStats })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Additional security checks
    const totalPayloadSize = JSON.stringify({ userInput, originalVerse, accuracy, userStats }).length
    if (totalPayloadSize > 5000) {
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
    
    // Validate API key format
    if (!openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      console.error('Invalid OpenAI API key format')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API configuration error',
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

    // Enhanced input sanitization
    const sanitizedUserInput = sanitizeInput(userInput)
    const sanitizedOriginalVerse = sanitizeInput(originalVerse)
    const sanitizedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)))

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
        temperature: 0.8,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        messages: [
          {
            role: 'system',
            content: `You are an expert Bible memorization coach with deep knowledge of Scripture and proven memorization techniques. You provide detailed, personalized feedback that combines spiritual encouragement with practical memorization strategies. Your responses should be warm, encouraging, and actionable.
            
            CRITICAL: You must respond ONLY with valid JSON. Do not include any text before or after the JSON.`
          },
          {
            role: 'user',
            content: `MEMORIZATION ATTEMPT ANALYSIS:

Original Verse: "${sanitizedOriginalVerse}"
User's Attempt: "${sanitizedUserInput}"
Accuracy Score: ${sanitizedAccuracy}%

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

Return ONLY this JSON format:
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
    
    let feedbackData
    try {
      const content = data.choices[0].message.content.trim()
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      feedbackData = JSON.parse(cleanContent)
      
      // Validate response structure
      if (!feedbackData.feedback || !feedbackData.analysis || !Array.isArray(feedbackData.strategies)) {
        throw new Error('Invalid response structure from OpenAI')
      }
      
      // Sanitize response data
      feedbackData.feedback = sanitizeInput(feedbackData.feedback || '')
      feedbackData.analysis = sanitizeInput(feedbackData.analysis || '')
      feedbackData.spiritualInsight = sanitizeInput(feedbackData.spiritualInsight || '')
      feedbackData.nextSteps = sanitizeInput(feedbackData.nextSteps || '')
      feedbackData.encouragement = sanitizeInput(feedbackData.encouragement || '')
      
      // Sanitize strategies array
      if (Array.isArray(feedbackData.strategies)) {
        feedbackData.strategies = feedbackData.strategies
          .slice(0, 6) // Limit to 6 strategies max
          .map((strategy: any) => sanitizeInput(String(strategy)))
          .filter((strategy: string) => strategy.length > 0)
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }

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
    console.error('AI Feedback Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        fallback: true,
        feedback: "Great effort on your memorization! Keep practicing to improve your accuracy.",
        suggestions: [
          "Try breaking the verse into smaller chunks",
          "Practice reading the verse aloud several times",
          "Focus on understanding the meaning to help with recall"
        ]
      }),
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