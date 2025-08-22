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
    // Reset or create new limit (15 requests per minute for international Bible API)
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }
  
  if (limit.count >= 15) {
    return true
  }
  
  limit.count++
  return false
}

const validateRequest = (data: any): boolean => {
  return data && 
         typeof data.reference === 'string' &&
         typeof data.version === 'string' &&
         typeof data.language === 'string' &&
         data.reference.length <= 100 &&
         data.version.length <= 50 &&
         data.language.length <= 10
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
}

// Bible Gateway API integration (free tier with rate limits)
const fetchFromBibleGateway = async (reference: string, version: string): Promise<any> => {
  try {
    // Bible Gateway allows limited free access through their lookup API
    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=${encodeURIComponent(version)}&interface=print`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Bible-Memory-AI/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Bible Gateway error: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Simple HTML parsing to extract verse text
    // This is a basic implementation - in production you'd want more robust parsing
    const verseMatch = html.match(/<span class="text"[^>]*>(.*?)<\/span>/s)
    const text = verseMatch ? verseMatch[1].replace(/<[^>]*>/g, '').trim() : ''
    
    return {
      reference,
      text,
      version,
      source: 'bible-gateway'
    }
  } catch (error) {
    console.error('Bible Gateway fetch error:', error)
    throw error
  }
}

// YouVersion API integration (requires API key but has free tier)
const fetchFromYouVersion = async (reference: string, version: string): Promise<any> => {
  try {
    // YouVersion API would require registration and API key
    // This is a placeholder for the integration
    throw new Error('YouVersion API requires API key registration')
  } catch (error) {
    console.error('YouVersion fetch error:', error)
    throw error
  }
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

    const { reference, version, language, action } = await req.json()
    
    // Validate input data
    if (!validateRequest({ reference, version, language, action })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize inputs
    const sanitizedReference = sanitizeInput(reference)
    const sanitizedVersion = sanitizeInput(version)
    const sanitizedLanguage = sanitizeInput(language)

    let result

    try {
      // Try Bible Gateway first (most reliable for international versions)
      result = await fetchFromBibleGateway(sanitizedReference, sanitizedVersion)
    } catch (error) {
      // Fallback to other APIs or return error
      console.error('All Bible APIs failed:', error)
      
      return new Response(
        JSON.stringify({ 
          error: 'Bible content temporarily unavailable',
          fallback: true,
          reference: sanitizedReference,
          text: 'Bible verse content is temporarily unavailable. Please try again later.',
          version: sanitizedVersion,
          language: sanitizedLanguage
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

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Bible Gateway API Error:', error)
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