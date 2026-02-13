import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_TOKENS = 300
const MAX_INPUT_LENGTH = 500
const MAX_REQUEST_SIZE = 5000

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
}

const isRateLimited = (clientIP: string): boolean => {
  const now = Date.now()
  const limit = rateLimitMap.get(clientIP)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 })
    return false
  }

  if (limit.count >= 15) return true
  limit.count++
  return false
}

const detectPromptInjection = (input: string): boolean => {
  const patterns = [
    /ignore\s+(previous|all)\s+(instructions|prompts)/i,
    /forget\s+(everything|all)\s+(above|before)/i,
    /system\s*:\s*you\s+are/i,
    /new\s+instructions?\s*:/i,
    /override\s+(system|previous)/i,
    /jailbreak/i,
    /pretend\s+to\s+be/i,
  ]
  return patterns.some(p => p.test(input))
}

const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/['"`;]/g, '')
    .trim()
    .substring(0, MAX_INPUT_LENGTH)
}

serve(async (req) => {
  const clientIP = getClientIP(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length < 27) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let requestData
    try {
      const body = await req.text()
      if (body.length > MAX_REQUEST_SIZE) throw new Error('Body too large')
      requestData = JSON.parse(body)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { word, verseText, verseReference } = requestData

    if (!word || typeof word !== 'string' || !verseText || typeof verseText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: word, verseText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (detectPromptInjection(word) || detectPromptInjection(verseText)) {
      return new Response(
        JSON.stringify({ error: 'Suspicious input detected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sanitizedWord = sanitizeInput(word)
    const sanitizedVerse = sanitizeInput(verseText)
    const sanitizedRef = sanitizeInput(verseReference || '')

    if (!sanitizedWord || !sanitizedVerse) {
      return new Response(
        JSON.stringify({ error: 'Invalid input after sanitization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiApiKey || !openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      // Return static fallback
      return new Response(
        JSON.stringify({
          fallback: true,
          soundsLike: `This word has ${sanitizedWord.length} letters. Try sounding it out syllable by syllable.`,
          modernEquivalent: "Think about what modern word you would use in this spot.",
          memoryTrick: "Close your eyes and picture yourself reading this verse aloud — what word fits naturally?",
          verseClue: `Look at the words right before and after the blank in ${sanitizedRef || 'the verse'} — what does the sentence need?`,
          synonyms: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        messages: [
          {
            role: 'system',
            content: `You are a creative Bible memory coach specializing in helping people RECALL forgotten words. You never say the word directly. Instead you give vivid, multi-sensory recall clues: what it sounds like, rhymes with, modern equivalents, phonetic breakdowns, visual imagery, and mnemonic tricks. You make each hint feel like a fun puzzle, not a dictionary entry. Respond ONLY with valid JSON.`
          },
          {
            role: 'user',
            content: `The user is memorizing this verse: "${sanitizedVerse}" (${sanitizedRef}).
They are stuck on the word: "${sanitizedWord}"

Give them RECALL-FOCUSED hints to help them remember this specific word. Do NOT write the word itself in any field.

HINT STRATEGY:
- "soundsLike": What does this word sound like? What does it rhyme with? Break it into syllables or phonetic chunks. E.g. for "begotten" you might say "be-GOT-ten — rhymes with 'forgotten', starts like 'begin'"
- "modernEquivalent": If this is an archaic/KJV word, what is the modern version? E.g. "whosoever" → "The modern way to say this is 'whoever' — but the KJV adds a prefix meaning 'any person at all'"
- "memoryTrick": A vivid mnemonic, mental image, or association trick. E.g. "Picture someone SO EVER determined to believe — that 'so' + 'ever' is baked right into the word"
- "verseClue": A contextual clue from the verse itself — what comes before/after, what the sentence needs. E.g. "Right before 'believeth' — who is the verse talking about? Everyone, anyone, ___"
- "synonyms": 2-3 modern synonyms or near-equivalents

Return ONLY this JSON:
{
  "soundsLike": "Phonetic breakdown, rhymes, similar-sounding words",
  "modernEquivalent": "Modern translation of this word and how it differs from the KJV form",
  "memoryTrick": "A vivid mnemonic or mental image to lock this word in memory",
  "verseClue": "A contextual clue using the surrounding words in the verse",
  "synonyms": ["synonym1", "synonym2"]
}`
          }
        ],
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI response')
    }

    let hintData
    try {
      const content = data.choices[0].message.content.trim()
      const clean = content.replace(/```json\n?|\n?```/g, '').trim()
      hintData = JSON.parse(clean)

      if (!hintData.soundsLike && !hintData.verseClue) {
        throw new Error('Invalid response structure')
      }

      // Sanitize all fields
      hintData.soundsLike = sanitizeInput(hintData.soundsLike || '')
      hintData.modernEquivalent = sanitizeInput(hintData.modernEquivalent || '')
      hintData.memoryTrick = sanitizeInput(hintData.memoryTrick || '')
      hintData.verseClue = sanitizeInput(hintData.verseClue || '')
      if (Array.isArray(hintData.synonyms)) {
        hintData.synonyms = hintData.synonyms.slice(0, 5).map((s: any) => sanitizeInput(String(s))).filter((s: string) => s.length > 0)
      } else {
        hintData.synonyms = []
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid JSON from OpenAI')
    }

    return new Response(
      JSON.stringify(hintData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        }
      }
    )

  } catch (error) {
    console.error('AI Word Hint Error:', error.message)
    return new Response(
      JSON.stringify({
        fallback: true,
        soundsLike: "AI hints are unavailable right now. Try the scrambled letters option instead!",
        modernEquivalent: "",
        memoryTrick: "Read the verse aloud and pause at the blank — your mouth may remember the word.",
        verseClue: "Look at the words surrounding the blank for context clues.",
        synonyms: []
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        }
      }
    )
  }
})
