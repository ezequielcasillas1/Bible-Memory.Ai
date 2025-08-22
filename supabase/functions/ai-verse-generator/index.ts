import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_TOKENS = 600
const MAX_INPUT_LENGTH = 500
const MAX_REQUEST_SIZE = 5000 // bytes
const ALLOWED_MODELS = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
const ALLOWED_VERSE_TYPES = ['commission', 'help']
const ALLOWED_TESTAMENTS = ['OT', 'NT']

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
    // Reset or create new limit (5 requests per minute for verse generation)
    rateLimitMap.set(clientIP, { 
      count: 1, 
      resetTime: now + 60000,
      violations: limit?.violations || 0
    })
    return false
  }
  
  if (limit.count >= 5) {
    // Progressive penalties for rate limit violations
    limit.violations++
    if (limit.violations >= 3) {
      // Block for 20 minutes after 3 violations
      limit.blockedUntil = now + 1200000
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
  
  if (!ALLOWED_VERSE_TYPES.includes(data.verseType)) {
    return { valid: false, error: 'Invalid verse type' }
  }
  
  if (!ALLOWED_TESTAMENTS.includes(data.testament)) {
    return { valid: false, error: 'Invalid testament' }
  }
  
  if (data.bibleVersion && (typeof data.bibleVersion !== 'string' || data.bibleVersion.length > 100)) {
    return { valid: false, error: 'Invalid Bible version' }
  }
  
  // Check for malicious patterns in all string inputs
  const stringInputs = [data.verseType, data.testament, data.bibleVersion].filter(Boolean)
  for (const input of stringInputs) {
    if (detectSQLInjection(input) || detectXSS(input) || detectPromptInjection(input)) {
      return { valid: false, error: 'Suspicious input detected' }
    }
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

    const { verseType, testament, bibleVersion } = requestData
    
    // Validate input data
    const validation = validateRequest({ verseType, testament, bibleVersion })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        const inputs = [verseType, testament, bibleVersion].filter(Boolean).join(' ')
        if (detectPromptInjection(inputs)) {
          trackSuspiciousActivity(clientIP, 'prompt')
        } else if (detectSQLInjection(inputs)) {
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
      throw new Error('OpenAI API key not configured')
    }
    
    // Validate API key format and security
    if (!validateOpenAIKey(openaiApiKey)) {
      console.error('Invalid OpenAI API key format or security issue')
      throw new Error('OpenAI API configuration error')
    }

    // Enhanced input sanitization
    const sanitizedBibleVersion = bibleVersion ? sanitizeInput(bibleVersion) : 'King James Version'
    const sanitizedVerseType = sanitizeInput(verseType)
    const sanitizedTestament = sanitizeInput(testament)

    // Additional validation after sanitization
    if (!sanitizedVerseType || !sanitizedTestament) {
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
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        } 
      }
    )

  } catch (error) {
    console.error('AI Verse Generator Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
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