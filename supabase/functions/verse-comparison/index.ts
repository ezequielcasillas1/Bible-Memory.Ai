import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userInput, originalVerse, bibleVersion } = await req.json()
    
    // Normalize text function
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    // Split into words
    const userWords = normalizeText(userInput).split(' ').filter(word => word.length > 0)
    const originalWords = normalizeText(originalVerse).split(' ').filter(word => word.length > 0)

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
      const total = correct + incorrect + missing + extra

      let feedback = `Analysis for ${version || 'your chosen Bible version'}:\n\n`
      
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
      detailedFeedback: generateDetailedFeedback(comparison.stats, bibleVersion)
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
    return new Response(
      JSON.stringify({ error: error.message }),
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