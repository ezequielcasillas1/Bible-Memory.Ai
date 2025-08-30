import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_REQUEST_SIZE = 15000 // bytes
const MAX_TEXT_LENGTH = 500
const MAX_BATCH_SIZE = 100

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
                         activity.oversizedRequests + activity.invalidTokens
  
  if (totalViolations >= 12) {
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
    // Reset or create new limit (50 requests per minute for UI translations)
    rateLimitMap.set(clientIP, { 
      count: 1, 
      resetTime: now + 60000,
      violations: limit?.violations || 0
    })
    return false
  }
  
  if (limit.count >= 50) {
    // Progressive penalties for rate limit violations
    limit.violations++
    if (limit.violations >= 3) {
      // Block for 5 minutes after 3 violations
      limit.blockedUntil = now + 300000
    }
    return true
  }
  
  limit.count++
  return false
}

const trackSuspiciousActivity = (clientIP: string, type: 'sql' | 'xss' | 'oversized' | 'token') => {
  const activity = suspiciousActivityMap.get(clientIP) || {
    sqlInjectionAttempts: 0,
    xssAttempts: 0,
    oversizedRequests: 0,
    invalidTokens: 0,
    lastActivity: Date.now()
  }
  
  switch (type) {
    case 'sql': activity.sqlInjectionAttempts++; break
    case 'xss': activity.xssAttempts++; break
    case 'oversized': activity.oversizedRequests++; break
    case 'token': activity.invalidTokens++; break
  }
  
  activity.lastActivity = Date.now()
  suspiciousActivityMap.set(clientIP, activity)
}

const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,
    /(WAITFOR|DELAY|BENCHMARK)/i
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

// UI-safe version for translation strings (less aggressive)
const detectSQLInjectionUI = (input: string): boolean => {
  const sqlPatterns = [
    // Only flag obvious SQL commands, not punctuation
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s+\w+)/i,
    /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,
    /(WAITFOR\s+DELAY|BENCHMARK\s*\()/i,
    // Only flag SQL comments with context, not standalone dashes
    /(--\s*\w+|\/\*.*\*\/)/,
    // Only flag suspicious combinations, not individual quotes
    /('.*OR.*'|".*AND.*")/i
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

// UI-safe version for translation strings (much less aggressive)
const detectXSSUI = (input: string): boolean => {
  const xssPatterns = [
    // Only flag actual script tags, not angle brackets in general
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:\s*\w+/gi, // Only flag javascript: with actual code
    /on\w+\s*=\s*["'][^"']*["']/gi, // Only flag complete event handlers
    /<iframe[^>]*src\s*=/gi, // Only flag iframes with src
    /data:text\/html[^;]*;/gi, // Only flag data URLs with HTML content
    /vbscript:\s*\w+/gi // Only flag vbscript: with actual code
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
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
    .substring(0, MAX_TEXT_LENGTH)
}

// UI-safe sanitization for translation strings (preserve legitimate punctuation)
const sanitizeInputUI = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:\s*\w+/gi, '') // Remove javascript: with code
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove complete event handlers
    .replace(/<iframe[^>]*>/gi, '') // Remove iframes
    .trim()
    .substring(0, MAX_TEXT_LENGTH)
}

// Supported UI languages with Google Translate codes
const SUPPORTED_UI_LANGUAGES: Record<string, string> = {
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'pt': 'pt',
  'it': 'it',
  'nl': 'nl',
  'zh-cn': 'zh-cn',
  'zh-tw': 'zh-tw',
  'ja': 'ja',
  'ko': 'ko',
  'hi': 'hi',
  'sw': 'sw',
  'tl': 'tl',
  'vi': 'vi',
  'th': 'th',
  'ms': 'ms',
  'id': 'id'
}

const validateRequest = (data: any): { valid: boolean; error?: string } => {
  if (!data) return { valid: false, error: 'No data provided' }
  
  if (!Array.isArray(data.texts)) {
    return { valid: false, error: 'Texts must be an array' }
  }
  
  if (data.texts.length === 0 || data.texts.length > MAX_BATCH_SIZE) {
    return { valid: false, error: `Invalid batch size (1-${MAX_BATCH_SIZE})` }
  }
  
  if (typeof data.targetLanguage !== 'string' || data.targetLanguage.length > 10) {
    return { valid: false, error: 'Invalid target language' }
  }
  
  if (!SUPPORTED_UI_LANGUAGES[data.targetLanguage]) {
    return { valid: false, error: 'Unsupported target language' }
  }
  
  // Validate each text
  for (const text of data.texts) {
    if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) {
      return { valid: false, error: 'Invalid text format or length' }
    }
    
    // Check for malicious patterns (UI-safe for translation strings)
    if (detectSQLInjectionUI(text) || detectXSSUI(text)) {
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

const validateGoogleApiKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') return false
  if (apiKey.length < 20) return false
  // Use UI-safe validation for API keys (less aggressive)
  if (detectSQLInjectionUI(apiKey) || detectXSSUI(apiKey)) return false
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

    const { texts, targetLanguage } = requestData
    
    // Validate input data
    const validation = validateRequest({ texts, targetLanguage })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        trackSuspiciousActivity(clientIP, detectSQLInjection(texts.join(' ')) ? 'sql' : 'xss')
      }
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If target language is English, return original texts
    if (targetLanguage === 'en') {
      return new Response(
        JSON.stringify({ 
          translations: texts,
          targetLanguage: 'en',
          source: 'original'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
    
    if (!googleApiKey) {
      console.log('Google Translate API key not configured, returning fallback');
      return new Response(
        JSON.stringify({ 
          error: 'Google Translate API key not configured',
          fallback: true,
          translations: texts // Return original texts as fallback
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
    if (!validateGoogleApiKey(googleApiKey)) {
      console.error('Invalid Google Translate API key format or security issue')
      return new Response(
        JSON.stringify({ 
          error: 'Google Translate API configuration error',
          fallback: true,
          translations: texts
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

    // Sanitize inputs (UI-safe for translation strings)
    const sanitizedTexts = texts.map((text: string) => sanitizeInputUI(text))
    const sanitizedTargetLanguage = SUPPORTED_UI_LANGUAGES[targetLanguage]

    // Additional validation after sanitization
    if (sanitizedTexts.some((text: string) => !text)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input after sanitization' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Translating ${sanitizedTexts.length} texts to ${sanitizedTargetLanguage}`);
    
    // Call Google Cloud Translate API with enhanced security
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(googleApiKey)}`
    
    const response = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bible-Memory-AI/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        q: sanitizedTexts,
        target: sanitizedTargetLanguage,
        source: 'en',
        format: 'text'
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Translate API error:', response.status, errorText)
      
      // Return fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Translation service temporarily unavailable',
          fallback: true,
          translations: texts
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

    const data = await response.json()
    console.log('Google Translate response received');
    
    if (!data.data || !data.data.translations) {
      console.error('Invalid Google Translate API response structure');
      throw new Error('Invalid Google Translate API response')
    }

    // Extract and sanitize translated texts (UI-safe)
    const translations = data.data.translations.map((translation: any) => 
      sanitizeInputUI(translation.translatedText || '')
    ).filter((text: string) => text.length > 0)

    // Ensure we have the same number of translations as inputs
    if (translations.length !== sanitizedTexts.length) {
      console.warn('Translation count mismatch, using fallback');
      return new Response(
        JSON.stringify({ 
          error: 'Translation incomplete',
          fallback: true,
          translations: texts
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

    console.log(`Successfully translated ${translations.length} texts`);
    
    return new Response(
      JSON.stringify({ 
        translations,
        targetLanguage: sanitizedTargetLanguage,
        source: 'google-translate'
      }),
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
    console.error('UI Translation Error:', error.message)
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable',
        fallback: true,
        translations: [] // Empty fallback
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