import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
         data.userInput.length <= 1000 &&
         data.originalVerse.length <= 1000
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

    // Sanitize inputs before sending to OpenAI
    const sanitizedUserInput = userInput.replace(/[<>]/g, '').trim()
    const sanitizedOriginalVerse = originalVerse.replace(/[<>]/g, '').trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 800,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content: `You are an expert Bible memorization coach with deep knowledge of Scripture and proven memorization techniques. You provide detailed, personalized feedback that combines spiritual encouragement with practical memorization strategies. Your responses should be warm, encouraging, and actionable.`
          },
          {
            role: 'user',
            content: `MEMORIZATION ATTEMPT ANALYSIS:

Original Verse: "${sanitizedOriginalVerse}"
User's Attempt: "${sanitizedUserInput}"
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
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response')
    }
    
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