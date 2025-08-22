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
    // Reset or create new limit (30 requests per minute for Bible API)
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }
  
  if (limit.count >= 30) {
    return true
  }
  
  limit.count++
  return false
}

const validateRequest = (data: any): boolean => {
  return data && 
         typeof data.reference === 'string' &&
         ['kjv', 'asv', 'darby', 'ylt'].includes(data.version) &&
         data.reference.length <= 500
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

    const { reference, version, action } = await req.json()
    
    // Validate input data
    if (!validateRequest({ reference, version, action })) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    // Sanitize inputs
    const sanitizedReference = reference.replace(/[<>]/g, '').trim()
    const sanitizedVersion = version.replace(/[<>]/g, '').trim()

    let apiUrl: string
    let response: Response

    if (action === 'getPassage') {
      // Get specific passage
      const formattedReference = sanitizedReference.toLowerCase().replace(/\s+/g, '+')
      apiUrl = `https://bible-api.com/${formattedReference}?translation=${sanitizedVersion}`
      
      response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Bible Memory AI App'
        }
      })

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Bible API service error: ${response.status}`,
            details: `Upstream bible-api.com returned ${response.status} for reference: ${sanitizedReference}`
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else if (action === 'search') {
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
      
      // Fetch multiple verses
      const results = []
      for (const verse of matchingVerses.slice(0, 5)) {
        try {
          const formattedVerse = verse.toLowerCase().replace(/\s+/g, '+')
          const verseUrl = `https://bible-api.com/${formattedVerse}?translation=${sanitizedVersion}`
          const verseResponse = await fetch(verseUrl, {
            headers: { 'User-Agent': 'Bible Memory AI App' }
          })
          
          if (verseResponse.ok) {
            const verseData = await verseResponse.json()
            results.push(verseData)
          } else {
            console.warn(`Failed to fetch ${verse}: ${verseResponse.status}`)
          }
        } catch (error) {
          console.warn(`Failed to fetch ${verse}:`, error)
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

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Bible API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Bible data' }),
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