import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_REQUEST_SIZE = 5000 // bytes
const MAX_REFERENCE_LENGTH = 200
const ALLOWED_VERSIONS = ['kjv', 'asv', 'darby', 'bbe', 'oeb-us', 'webbe']
const ALLOWED_ACTIONS = ['getPassage', 'search']

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
  
  if (totalViolations >= 10) {
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
    // Reset or create new limit (30 requests per minute for Bible API)
    rateLimitMap.set(clientIP, { 
      count: 1, 
      resetTime: now + 60000,
      violations: limit?.violations || 0
    })
    return false
  }
  
  if (limit.count >= 30) {
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

// Sanitize Bible references (with length limit for security)
const sanitizeReference = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/['"`;]/g, '') // Remove quotes and semicolons
    .trim()
    .substring(0, MAX_REFERENCE_LENGTH) // Apply length limit for references
}

// Sanitize verse text content (no length limit, preserve full text)
const sanitizeVerseText = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/['"`;]/g, '') // Remove quotes and semicolons
    .trim()
    // NO .substring() - preserve full verse text
}

const validateRequest = (data: any): { valid: boolean; error?: string } => {
  if (!data) return { valid: false, error: 'No data provided' }
  
  if (typeof data.reference !== 'string') {
    return { valid: false, error: 'Invalid reference type' }
  }
  
  if (data.reference.length > MAX_REFERENCE_LENGTH) {
    return { valid: false, error: 'Reference too long' }
  }
  
  if (!ALLOWED_VERSIONS.includes(data.version)) {
    return { valid: false, error: 'Invalid Bible version' }
  }
  
  if (!ALLOWED_ACTIONS.includes(data.action)) {
    return { valid: false, error: 'Invalid action' }
  }
  
  // Check for malicious patterns
  if (detectSQLInjection(data.reference)) {
    return { valid: false, error: 'Suspicious input detected' }
  }
  
  if (detectXSS(data.reference)) {
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

    const { reference, version, action } = requestData
    
    // Validate input data
    const validation = validateRequest({ reference, version, action })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        trackSuspiciousActivity(clientIP, detectSQLInjection(reference) ? 'sql' : 'xss')
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
    const sanitizedReference = sanitizeReference(reference)
    const sanitizedVersion = sanitizeReference(version)
    const sanitizedAction = sanitizeReference(action)

    // Additional validation after sanitization
    if (!sanitizedReference || !sanitizedVersion || !sanitizedAction) {
      return new Response(
        JSON.stringify({ error: 'Invalid input after sanitization' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let apiUrl: string
    let response: Response

    if (sanitizedAction === 'getPassage') {
      // Get specific passage
      const formattedReference = sanitizedReference.toLowerCase().replace(/\s+/g, '+')
      apiUrl = `https://bible-api.com/${encodeURIComponent(formattedReference)}?translation=${encodeURIComponent(sanitizedVersion)}`
      
      response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Bible Memory AI App/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
    } else if (sanitizedAction === 'search') {
      // Search functionality - using popular verses as fallback
      const popularVerses = [
        'John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Jeremiah 29:11',
        'Psalm 23:1', 'Proverbs 3:5-6', 'Matthew 11:28', 'Isaiah 40:31',
        'Joshua 1:9', '1 Corinthians 13:4-7', 'Romans 12:2', 'Ephesians 2:8-9'
      ]
      
      const matchingVerses = popularVerses.filter(verse => 
        verse.toLowerCase().includes(sanitizedReference.toLowerCase()) ||
        sanitizedReference.toLowerCase().includes(verse.toLowerCase().split(' ')[0])
      )
      
      if (matchingVerses.length === 0) {
        return new Response(
          JSON.stringify({ results: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Fetch multiple verses with timeout and error handling
      const results = []
      for (const verse of matchingVerses.slice(0, 5)) {
        try {
          const formattedVerse = verse.toLowerCase().replace(/\s+/g, '+')
          const verseUrl = `https://bible-api.com/${encodeURIComponent(formattedVerse)}?translation=${encodeURIComponent(sanitizedVersion)}`
          const verseResponse = await fetch(verseUrl, {
            headers: { 
              'User-Agent': 'Bible Memory AI App/1.0',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout per verse
          })
          
          if (verseResponse.ok) {
            const verseData = await verseResponse.json()
            // Sanitize response data
            if (verseData && verseData.text) {
              verseData.text = sanitizeVerseText(verseData.text)
              verseData.reference = sanitizeReference(verseData.reference || verse)
              results.push(verseData)
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch ${verse}:`, error.message)
        }
      }
      
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Sanitize response data
    if (data && data.text) {
      data.text = sanitizeVerseText(data.text)
    }
    if (data && data.reference) {
      data.reference = sanitizeReference(data.reference)
    }

    return new Response(
      JSON.stringify(data),
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
    console.error('Bible API Error:', error.message)
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