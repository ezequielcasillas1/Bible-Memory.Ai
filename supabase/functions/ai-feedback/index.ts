import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_TOKENS = 800
const MAX_INPUT_LENGTH = 1000
const MAX_REQUEST_SIZE = 10000 // bytes
const ALLOWED_MODELS = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']

// Rate limiting with IP tracking and progressive penalties
const rateLimitMap = new Map<string, { 
  count: number; 
  resetTime: number; 
  violations: number;
  blockedUntil?: number;
}>()

// Suspicious activity tracking
const suspiciousActivityMap = new Map<string, {
  sqlInjectionAttempts: number;
  xssAttempts: number;
  oversizedRequests: number;
  invalidTokens: number;
  promptInjectionAttempts: number;
  lastActivity: number;
}>()

// Security helper functions
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') ||
         'unknown'
}

const isBlocked = (clientIP: string): boolean => {
  const activity = suspiciousActivityMap.get(clientIP)
  if (!activity) return false
  
  // Block if too many violations
  const totalViolations = activity.sqlInjectionAttempts + activity.xssAttempts + 
                         activity.oversizedRequests + activity.invalidTokens + 
                         activity.promptInjectionAttempts
  
  if (totalViolations >= 15) {
    return true // Permanent block for severe violations
  }
  
  return false
}

const isRateLimited = (clientIP: string): boolean => {
  const now = Date.now()
  const limit = rateLimitMap.get(clientIP)
  
  // Check if IP is temporarily blocked
  if (limit?.blockedUntil && now < limit.blockedUntil) {
    return true
  }
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (10 requests per minute for AI feedback)
    rateLimitMap.set(clientIP, { 
      count: 1, 
      resetTime: now + 60000,
      violations: limit?.violations || 0
    })
    return false
  }
  
  if (limit.count >= 10) {
    // Progressive penalties for rate limit violations
    limit.violations++
    if (limit.violations >= 3) {
      // Block for 15 minutes after 3 violations
      limit.blockedUntil = now + 900000
    }
    return true
  }
  
  limit.count++
  return false
}

const trackSuspiciousActivity = (clientIP: string, type: 'sql' | 'xss' | 'oversized' | 'token' | 'prompt') => {
  const activity = suspiciousActivityMap.get(clientIP) || {
    sqlInjectionAttempts: 0,
    xssAttempts: 0,
    oversizedRequests: 0,
    invalidTokens: 0,
    promptInjectionAttempts: 0,
    lastActivity: Date.now()
  }
  
  switch (type) {
    case 'sql': activity.sqlInjectionAttempts++; break
    case 'xss': activity.xssAttempts++; break
    case 'oversized': activity.oversizedRequests++; break
    case 'token': activity.invalidTokens++; break
    case 'prompt': activity.promptInjectionAttempts++; break
  }
  
  activity.lastActivity = Date.now()
  suspiciousActivityMap.set(clientIP, activity)
}

const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,
    /(WAITFOR|DELAY|BENCHMARK)/i
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

const detectPromptInjection = (input: string): boolean => {
  const promptInjectionPatterns = [
    /ignore\s+(previous|all)\s+(instructions|prompts)/i,
    /forget\s+(everything|all)\s+(above|before)/i,
    /system\s*:\s*you\s+are/i,
    /new\s+instructions?\s*:/i,
    /override\s+(system|previous)/i,
    /jailbreak/i,
    /pretend\s+to\s+be/i,
    /act\s+as\s+(if\s+you\s+are|a)/i,
    /roleplay\s+as/i,
    /simulate\s+(being|a)/i
  ]
  
  return promptInjectionPatterns.some(pattern => pattern.test(input))
}

const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/['"`;]/g, '') // Remove quotes and semicolons
    .trim()
    .substring(0, MAX_INPUT_LENGTH)
}

const validateRequest = (data: any): { valid: boolean; error?: string } => {
  if (!data) return { valid: false, error: 'No data provided' }
  
  if (typeof data.userInput !== 'string' || typeof data.originalVerse !== 'string') {
    return { valid: false, error: 'Invalid input types' }
  }
  
  if (typeof data.accuracy !== 'number' || data.accuracy < 0 || data.accuracy > 100) {
    return { valid: false, error: 'Invalid accuracy value' }
  }
  
  if (data.userInput.length > MAX_INPUT_LENGTH || data.originalVerse.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Input too long' }
  }
  
  // Check for malicious patterns
  if (detectSQLInjection(data.userInput) || detectSQLInjection(data.originalVerse)) {
    return { valid: false, error: 'Suspicious input detected' }
  }
  
  if (detectXSS(data.userInput) || detectXSS(data.originalVerse)) {
    return { valid: false, error: 'Suspicious input detected' }
  }
  
  if (detectPromptInjection(data.userInput) || detectPromptInjection(data.originalVerse)) {
    return { valid: false, error: 'Suspicious input detected' }
  }
  
  return { valid: true }
}

const validateAuthToken = (authHeader: string | null): boolean => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  
  // Basic token format validation
  if (token.length < 20 || token.length > 500) {
    return false
  }
  
  // Check for suspicious token patterns
  if (detectSQLInjection(token) || detectXSS(token)) {
    return false
  }
  
  return true
}

const validateOpenAIKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') return false
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) return false
  if (detectSQLInjection(apiKey) || detectXSS(apiKey)) return false
  return true
}

serve(async (req) => {
  const clientIP = getClientIP(req)
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if IP is blocked for suspicious activity
    if (isBlocked(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Rate limiting with progressive penalties
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

    // Check request size before parsing
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      trackSuspiciousActivity(clientIP, 'oversized')
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { 
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate authorization header
    const authHeader = req.headers.get('authorization')
    if (!validateAuthToken(authHeader)) {
      trackSuspiciousActivity(clientIP, 'token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and validate request body
    let requestData
    try {
      const body = await req.text()
      if (body.length > MAX_REQUEST_SIZE) {
        trackSuspiciousActivity(clientIP, 'oversized')
        throw new Error('Request body too large')
      }
      requestData = JSON.parse(body)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { userInput, originalVerse, accuracy, userStats } = requestData
    
    // Validate input data
    const validation = validateRequest({ userInput, originalVerse, accuracy, userStats })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        if (detectPromptInjection(userInput) || detectPromptInjection(originalVerse)) {
          trackSuspiciousActivity(clientIP, 'prompt')
        } else if (detectSQLInjection(userInput) || detectSQLInjection(originalVerse)) {
          trackSuspiciousActivity(clientIP, 'sql')
        } else {
          trackSuspiciousActivity(clientIP, 'xss')
        }
      }
      return new Response(
        JSON.stringify({ error: validation.error }),
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
    
    // Validate API key format and security
    if (!validateOpenAIKey(openaiApiKey)) {
      console.error('Invalid OpenAI API key format or security issue')
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

    // Additional validation after sanitization
    if (!sanitizedUserInput || !sanitizedOriginalVerse) {
      return new Response(
        JSON.stringify({ error: 'Invalid input after sanitization' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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
- Total verses memorized: ${userStats?.versesMemorized || 0}
- Current streak: ${userStats?.currentStreak || 0} days
- Average accuracy: ${Math.round(userStats?.averageAccuracy || 0)}%
- Experience level: ${(userStats?.versesMemorized || 0) < 5 ? 'Beginner' : (userStats?.versesMemorized || 0) < 20 ? 'Intermediate' : 'Advanced'}

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
      signal: AbortSignal.timeout(30000) // 30 second timeout
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
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        } 
      }
    )

  } catch (error) {
    console.error('AI Feedback Error:', error.message)
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable',
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
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        } 
      }
    )
  }
})