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
    // 50 UI translation requests per minute (UI translations are frequent)
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }
  
  if (limit.count >= 50) {
    return true
  }
  
  limit.count++
  return false
}

const validateRequest = (data: any): boolean => {
  return data && 
         typeof data.texts === 'object' &&
         Array.isArray(data.texts) &&
         data.texts.length > 0 &&
         data.texts.length <= 100 && // Limit batch size
         typeof data.targetLanguage === 'string' &&
         data.targetLanguage.length <= 10 &&
         data.texts.every((text: any) => typeof text === 'string' && text.length <= 500)
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
    .substring(0, 500)
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

    const { texts, targetLanguage } = await req.json()
    
    // Validate input data
    if (!validateRequest({ texts, targetLanguage })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if target language is supported
    if (!SUPPORTED_UI_LANGUAGES[targetLanguage]) {
      return new Response(
        JSON.stringify({ error: 'Unsupported target language' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If target language is English, return original texts
    if (targetLanguage === 'en') {
      return new Response(
        JSON.stringify({ translations: texts }),
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

    // Validate API key format
    if (googleApiKey.length < 20) {
      console.error('Invalid Google Translate API key format')
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

    // Sanitize inputs
    const sanitizedTexts = texts.map((text: string) => sanitizeInput(text))
    const sanitizedTargetLanguage = SUPPORTED_UI_LANGUAGES[targetLanguage]

    // Call Google Cloud Translate API
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`
    
    const response = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bible-Memory-AI/1.0',
      },
      body: JSON.stringify({
        q: sanitizedTexts,
        target: sanitizedTargetLanguage,
        source: 'en',
        format: 'text'
      }),
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
    
    if (!data.data || !data.data.translations) {
      throw new Error('Invalid Google Translate API response')
    }

    // Extract translated texts
    const translations = data.data.translations.map((translation: any) => translation.translatedText)

    return new Response(
      JSON.stringify({ 
        translations,
        targetLanguage: sanitizedTargetLanguage,
        source: 'google-translate'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('UI Translation Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        fallback: true,
        translations: [] // Empty fallback
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