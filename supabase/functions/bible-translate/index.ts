import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

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
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

const isRateLimited = (clientIP: string): boolean => {
  const now = Date.now()
  const limit = rateLimitMap.get(clientIP)
  
  if (!limit || now > limit.resetTime) {
    // 10 translations per minute (translation is resource intensive)
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
         typeof data.text === 'string' && 
         typeof data.targetLanguage === 'string' &&
         typeof data.sourceVersion === 'string' &&
         data.text.length <= 2000 &&
         data.text.length > 0 &&
         SUPPORTED_LANGUAGES[data.targetLanguage] &&
         ['kjv', 'asv', 'darby', 'bbe', 'oeb-us', 'webbe'].includes(data.sourceVersion)
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
    .substring(0, 2000)
}

async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Use Google Translate free API with proper full text handling
    const googleResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}&ie=UTF-8&oe=UTF-8&format=text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Bible-Memory-AI/1.0)',
      },
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
          return fullTranslation
        }
      }
    }

    // Fallback 1: LibreTranslate with full text support
    const libreResponse = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
        api_key: null // Use free tier
      })
    })

    if (libreResponse.ok) {
      const libreData = await libreResponse.json()
      if (libreData.translatedText) {
        return libreData.translatedText
      }
    }

    // Fallback 2: MyMemory API (limit to 500 chars due to their restrictions)
    const myMemoryResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|${targetLang}`)
    
    if (myMemoryResponse.ok) {
      const myMemoryData = await myMemoryResponse.json()
      if (myMemoryData.responseData && myMemoryData.responseData.translatedText) {
        return myMemoryData.responseData.translatedText
      }
    }

    return `[Translation Unavailable: All translation services failed for this ${text.length > 500 ? 'long' : 'short'} text]`
  } catch (error) {
    console.error('Translation error:', error)
    return '[Translation Unavailable: Network Error]'
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

    const requestData = await req.json()
    const { text, targetLanguage, sourceVersion, reference } = requestData
    
    // Additional security checks
    const totalPayloadSize = JSON.stringify({ text, targetLanguage, sourceVersion, reference }).length
    if (totalPayloadSize > 10000) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { 
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Validate input data
    if (!validateRequest({ text, targetLanguage, sourceVersion })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize inputs
    const sanitizedText = sanitizeInput(text)
    const sanitizedReference = reference ? sanitizeInput(reference) : ''

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
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Bible Translation Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Translation service temporarily unavailable',
        details: error.message 
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