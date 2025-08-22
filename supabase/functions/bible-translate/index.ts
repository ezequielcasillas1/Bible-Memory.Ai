import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_REQUEST_SIZE = 15000 // bytes
const MAX_TEXT_LENGTH = 2000
const ALLOWED_VERSIONS = ['kjv', 'asv', 'darby', 'bbe', 'oeb-us', 'webbe']

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

// Strategic language pairings based on translation accuracy and clarity
const LANGUAGE_STRATEGIES = {
  // Romance & Germanic languages - best with formal translations (KJV, ASV, Darby)
  romance_germanic: {
    languages: ['es', 'fr', 'de', 'pt', 'it', 'nl'],
    preferredSources: ['kjv', 'asv', 'darby'],
    description: 'Formal translations work best due to similar grammar structures'
  },
  
  // Asian & African languages - best with simplified English (BBE, OEB-US)
  asian_african: {
    languages: ['zh', 'zh-cn', 'zh-tw', 'ja', 'ko', 'sw', 'hi'],
    preferredSources: ['bbe', 'oeb-us'],
    description: 'Simplified English reduces theological distortion and complexity'
  },
  
  // Missionary/Global languages - best with modern clear English (WEBBE, OEB-US)
  missionary_global: {
    languages: ['tl', 'zu', 'vi', 'th', 'ms', 'id'],
    preferredSources: ['webbe', 'oeb-us'],
    description: 'Modern, clear English optimized for global Christian readership'
  }
}

// Language metadata with full names and recommendations
const SUPPORTED_LANGUAGES: Record<string, any> = {
  // Romance & Germanic (Formal translations recommended)
  'es': { name: 'Spanish', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  'fr': { name: 'French', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  'de': { name: 'German', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  'pt': { name: 'Portuguese', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  'it': { name: 'Italian', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  'nl': { name: 'Dutch', strategy: 'romance_germanic', recommended: ['kjv', 'asv', 'darby'] },
  
  // Asian & African (Simplified translations recommended)
  'zh': { name: 'Chinese (Simplified)', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'zh-cn': { name: 'Chinese (Simplified)', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'zh-tw': { name: 'Chinese (Traditional)', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'ja': { name: 'Japanese', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'ko': { name: 'Korean', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'sw': { name: 'Swahili', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  'hi': { name: 'Hindi', strategy: 'asian_african', recommended: ['bbe', 'oeb-us'] },
  
  // Missionary/Global (Modern translations recommended)
  'tl': { name: 'Tagalog', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] },
  'zu': { name: 'Zulu', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] },
  'vi': { name: 'Vietnamese', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] },
  'th': { name: 'Thai', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] },
  'ms': { name: 'Malay', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] },
  'id': { name: 'Indonesian', strategy: 'missionary_global', recommended: ['webbe', 'oeb-us'] }
}

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
    // 10 translations per minute (translation is resource intensive)
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
      // Block for 10 minutes after 3 violations
      limit.blockedUntil = now + 600000
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

const validateRequest = (data: any): { valid: boolean; error?: string } => {
  if (!data) return { valid: false, error: 'No data provided' }
  
  if (typeof data.text !== 'string' || data.text.length === 0) {
    return { valid: false, error: 'Invalid text' }
  }
  
  if (data.text.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: 'Text too long' }
  }
  
  if (typeof data.targetLanguage !== 'string' || !SUPPORTED_LANGUAGES[data.targetLanguage]) {
    return { valid: false, error: 'Invalid target language' }
  }
  
  if (typeof data.sourceVersion !== 'string' || !ALLOWED_VERSIONS.includes(data.sourceVersion)) {
    return { valid: false, error: 'Invalid source version' }
  }
  
  // Check for malicious patterns
  if (detectSQLInjection(data.text) || detectXSS(data.text)) {
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

async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Use Google Translate free API with proper full text handling
    const googleResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}&ie=UTF-8&oe=UTF-8&format=text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Bible-Memory-AI/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (googleResponse.ok) {
      const data = await googleResponse.json()
      if (data && data[0] && Array.isArray(data[0])) {
        // Google Translate returns nested arrays of translation segments
        // Concatenate ALL segments to preserve the complete verse
        let fullTranslation = ''
        for (const segment of data[0]) {
          if (segment && segment[0] && typeof segment[0] === 'string') {
            fullTranslation += segment[0]
          }
        }
        // Return the complete translation without trimming to preserve formatting
        if (fullTranslation) {
          return sanitizeInput(fullTranslation)
        }
      }
    }

    // Fallback 1: LibreTranslate with full text support
    const libreResponse = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
        api_key: null // Use free tier
      }),
      signal: AbortSignal.timeout(8000) // 8 second timeout
    })

    if (libreResponse.ok) {
      const libreData = await libreResponse.json()
      if (libreData.translatedText) {
        return sanitizeInput(libreData.translatedText)
      }
    }

    // Fallback 2: MyMemory API (limit to 500 chars due to their restrictions)
    const myMemoryResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|${encodeURIComponent(targetLang)}`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (myMemoryResponse.ok) {
      const myMemoryData = await myMemoryResponse.json()
      if (myMemoryData.responseData && myMemoryData.responseData.translatedText) {
        return sanitizeInput(myMemoryData.responseData.translatedText)
      }
    }

    return `[Translation Unavailable: All translation services failed for this ${text.length > 500 ? 'long' : 'short'} text]`
  } catch (error) {
    console.error('Translation error:', error.message)
    return '[Translation Unavailable: Network Error]'
  }
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

    const { text, targetLanguage, sourceVersion, reference } = requestData
    
    // Validate input data
    const validation = validateRequest({ text, targetLanguage, sourceVersion, reference })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        trackSuspiciousActivity(clientIP, detectSQLInjection(text) ? 'sql' : 'xss')
      }
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize inputs
    const sanitizedText = sanitizeInput(text)
    const sanitizedReference = reference ? sanitizeInput(reference) : ''

    // Additional validation after sanitization
    if (!sanitizedText) {
      return new Response(
        JSON.stringify({ error: 'Invalid input after sanitization' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get language info
    const languageInfo = SUPPORTED_LANGUAGES[targetLanguage]
    
    // Check if source version is recommended for this language
    const isRecommended = languageInfo.recommended.includes(sourceVersion)
    
    // Perform translation
    let translatedText: string
    try {
      translatedText = await translateText(sanitizedText, targetLanguage)
    } catch (error) {
      translatedText = '[Translation service temporarily unavailable]'
    }
    
    // Prepare response
    const response = {
      translatedText,
      originalText: sanitizedText,
      reference: sanitizedReference,
      sourceVersion: sourceVersion.toUpperCase(),
      targetLanguage: languageInfo.name,
      targetLanguageCode: targetLanguage,
      strategy: languageInfo.strategy,
      isRecommendedPairing: isRecommended,
      recommendation: isRecommended 
        ? `${sourceVersion.toUpperCase()} is recommended for ${languageInfo.name} translations`
        : `For better accuracy in ${languageInfo.name}, consider using: ${languageInfo.recommended.map(v => v.toUpperCase()).join(', ')}`,
      strategyNote: LANGUAGE_STRATEGIES[languageInfo.strategy].description
    }

    return new Response(
      JSON.stringify(response),
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
    console.error('Bible Translation Error:', error.message)
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable',
        details: 'Translation service is currently unavailable'
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