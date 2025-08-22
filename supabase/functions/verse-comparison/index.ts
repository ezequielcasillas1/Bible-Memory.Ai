import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced security constants
const MAX_REQUEST_SIZE = 8000 // bytes
const MAX_TEXT_LENGTH = 2000

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
    // Reset or create new limit (20 requests per minute for comparison)
    rateLimitMap.set(clientIP, { 
      count: 1, 
      resetTime: now + 60000,
      violations: limit?.violations || 0
    })
    return false
  }
  
  if (limit.count >= 20) {
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
  
  if (typeof data.userInput !== 'string' || typeof data.originalVerse !== 'string') {
    return { valid: false, error: 'Invalid input types' }
  }
  
  if (data.userInput.length > MAX_TEXT_LENGTH || data.originalVerse.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: 'Input too long' }
  }
  
  // Check for malicious patterns
  if (detectSQLInjection(data.userInput) || detectSQLInjection(data.originalVerse)) {
    return { valid: false, error: 'Suspicious input detected' }
  }
  
  if (detectXSS(data.userInput) || detectXSS(data.originalVerse)) {
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

interface WordComparison {
  userWord: string;
  originalWord: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  position: number;
  suggestion?: string;
}

interface ComparisonResult {
  accuracy: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  missingWords: number;
  extraWords: number;
  userComparison: WordComparison[];
  originalComparison: WordComparison[];
  detailedFeedback: string;
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

    const { userInput, originalVerse, bibleVersion } = requestData
    
    // Validate input data
    const validation = validateRequest({ userInput, originalVerse, bibleVersion })
    if (!validation.valid) {
      if (validation.error === 'Suspicious input detected') {
        trackSuspiciousActivity(clientIP, detectSQLInjection(userInput + originalVerse) ? 'sql' : 'xss')
      }
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Normalize text function
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    // Sanitize inputs
    const sanitizedUserInput = sanitizeInput(userInput)
    const sanitizedOriginalVerse = sanitizeInput(originalVerse)
    const sanitizedBibleVersion = bibleVersion ? sanitizeInput(bibleVersion) : 'Unknown Version'

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

    // Split into words
    const userWords = normalizeText(sanitizedUserInput).split(' ').filter(word => word.length > 0)
    const originalWords = normalizeText(sanitizedOriginalVerse).split(' ').filter(word => word.length > 0)

    // Advanced word comparison using dynamic programming (Levenshtein-like approach)
    const compareWords = (user: string[], original: string[]): {
      userComparison: WordComparison[];
      originalComparison: WordComparison[];
      stats: { correct: number; incorrect: number; missing: number; extra: number };
    } => {
      const userComparison: WordComparison[] = []
      const originalComparison: WordComparison[] = []
      const stats = { correct: 0, incorrect: 0, missing: 0, extra: 0 }

      // Create alignment matrix for optimal word matching
      const matrix: number[][] = Array(user.length + 1)
        .fill(null)
        .map(() => Array(original.length + 1).fill(0))

      // Initialize matrix
      for (let i = 0; i <= user.length; i++) matrix[i][0] = i
      for (let j = 0; j <= original.length; j++) matrix[0][j] = j

      // Fill matrix
      for (let i = 1; i <= user.length; i++) {
        for (let j = 1; j <= original.length; j++) {
          if (user[i - 1] === original[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,     // deletion
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j - 1] + 1  // substitution
            )
          }
        }
      }

      // Backtrack to find optimal alignment
      let i = user.length, j = original.length
      const userAligned: (string | null)[] = []
      const originalAligned: (string | null)[] = []

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && user[i - 1] === original[j - 1]) {
          userAligned.unshift(user[i - 1])
          originalAligned.unshift(original[j - 1])
          i--; j--
        } else if (i > 0 && (j === 0 || matrix[i - 1][j] <= matrix[i][j - 1])) {
          userAligned.unshift(user[i - 1])
          originalAligned.unshift(null)
          i--
        } else {
          userAligned.unshift(null)
          originalAligned.unshift(original[j - 1])
          j--
        }
      }

      // Process aligned words
      for (let pos = 0; pos < Math.max(userAligned.length, originalAligned.length); pos++) {
        const userWord = userAligned[pos]
        const originalWord = originalAligned[pos]

        if (userWord && originalWord) {
          // Both words exist - check if they match
          if (userWord === originalWord) {
            userComparison.push({
              userWord,
              originalWord,
              status: 'correct',
              position: pos
            })
            originalComparison.push({
              userWord,
              originalWord,
              status: 'correct',
              position: pos
            })
            stats.correct++
          } else {
            userComparison.push({
              userWord,
              originalWord,
              status: 'incorrect',
              position: pos,
              suggestion: `Should be "${originalWord}"`
            })
            originalComparison.push({
              userWord,
              originalWord,
              status: 'incorrect',
              position: pos,
              suggestion: `You wrote "${userWord}"`
            })
            stats.incorrect++
          }
        } else if (userWord && !originalWord) {
          // Extra word in user input
          userComparison.push({
            userWord,
            originalWord: '',
            status: 'extra',
            position: pos,
            suggestion: 'This word should be removed'
          })
          stats.extra++
        } else if (!userWord && originalWord) {
          // Missing word in user input
          originalComparison.push({
            userWord: '',
            originalWord,
            status: 'missing',
            position: pos,
            suggestion: 'This word was missing from your answer'
          })
          stats.missing++
        }
      }

      return { userComparison, originalComparison, stats }
    }

    const comparison = compareWords(userWords, originalWords)
    const totalWords = originalWords.length
    const accuracy = totalWords > 0 ? Math.round((comparison.stats.correct / totalWords) * 100) : 0

    // Generate detailed feedback
    const generateDetailedFeedback = (stats: typeof comparison.stats, version: string): string => {
      const { correct, incorrect, missing, extra } = stats

      let feedback = `Analysis for ${sanitizedBibleVersion}:\n\n`
      
      if (correct === totalWords) {
        feedback += "🎉 Perfect! You memorized the verse exactly as written."
      } else {
        feedback += `📊 Word Analysis:\n`
        feedback += `• Correct words: ${correct}/${totalWords}\n`
        if (incorrect > 0) feedback += `• Incorrect words: ${incorrect}\n`
        if (missing > 0) feedback += `• Missing words: ${missing}\n`
        if (extra > 0) feedback += `• Extra words: ${extra}\n\n`

        feedback += "💡 Focus Areas:\n"
        if (missing > 0) feedback += "• Pay attention to words you might have skipped\n"
        if (incorrect > 0) feedback += "• Double-check the exact wording of challenging words\n"
        if (extra > 0) feedback += "• Practice reciting without adding extra words\n"
      }

      return feedback
    }

    const result: ComparisonResult = {
      accuracy,
      totalWords,
      correctWords: comparison.stats.correct,
      incorrectWords: comparison.stats.incorrect,
      missingWords: comparison.stats.missing,
      extraWords: comparison.stats.extra,
      userComparison: comparison.userComparison,
      originalComparison: comparison.originalComparison,
      detailedFeedback: generateDetailedFeedback(comparison.stats, sanitizedBibleVersion)
    }

    return new Response(
      JSON.stringify(result),
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
    console.error('Verse Comparison Error:', error.message)
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