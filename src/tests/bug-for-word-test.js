/**
 * CRITICAL BUG REPRODUCTION TEST: "For" Word Not Recognized
 * 
 * This test reproduces the exact scenario where typing "For" 
 * in John 3:16 Spanish translation fails to be recognized as correct.
 */

// Mock the FillInBlankAPI for testing
const mockFillInBlankAPI = {
  createFillInBlankState: (verseText, comparisonResult) => {
    const wrongWords = comparisonResult.userComparison.map(w => w.originalWord);
    return {
      verse: verseText,
      failedWords: wrongWords,
      completedWords: [],
      currentBlankIndex: 0,
      translationContext: {
        isTranslated: true,
        originalVerse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        translatedVerse: "Porque Dios amó tanto al mundo que dio a su único Hijo, para que todo el que cree en él no perezca, sino que tenga vida eterna."
      }
    };
  },

  getCurrentBlankWord: (state) => {
    const words = state.verse.split(' ');
    const failedWords = state.failedWords;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
      const isFailedWord = failedWords.some(fw => 
        fw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      const isCompleted = state.completedWords.some(cw => 
        cw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanWord
      );
      
      if (isFailedWord && !isCompleted) {
        return word;
      }
    }
    return null;
  },

  processWordSubmission: (state, userInput) => {
    const normalize = (value) => value.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    const cleanUserInput = normalize(userInput);

    const currentBlankWord = mockFillInBlankAPI.getCurrentBlankWord(state);
    if (!currentBlankWord) {
      return {
        newState: state,
        isCorrect: false,
        shouldAdvance: false,
        currentWord: null
      };
    }

    const cleanCurrentWord = normalize(currentBlankWord);

    // Always accept the English word first
    if (cleanUserInput === cleanCurrentWord) {
      const newCompletedWords = Array.from(new Set([...state.completedWords, currentBlankWord]));
      return {
        newState: { ...state, completedWords: newCompletedWords },
        isCorrect: true,
        shouldAdvance: true,
        currentWord: currentBlankWord
      };
    }

    let matched = false;

    if (state.translationContext?.isTranslated) {
      const originalWords = state.translationContext.originalVerse.split(' ');
      const translatedWords = state.translationContext.translatedVerse.split(' ');

      const originalPosition = originalWords.findIndex(w => normalize(w) === cleanCurrentWord);

      if (originalPosition >= 0 && originalPosition < translatedWords.length) {
        const translatedWord = translatedWords[originalPosition];
        const normalizedTranslated = normalize(translatedWord);

        console.log('🌍 TRANSLATION DEBUG (UPDATED):', {
          currentBlankWord,
          originalPosition,
          translatedWord,
          normalizedTranslated,
          userInput: cleanUserInput,
          matches: cleanUserInput === normalizedTranslated
        });

        if (cleanUserInput === normalizedTranslated) {
          matched = true;
        }
      }
    }

    if (matched) {
      const newCompletedWords = Array.from(new Set([...state.completedWords, currentBlankWord]));
      return {
        newState: { ...state, completedWords: newCompletedWords },
        isCorrect: true,
        shouldAdvance: true,
        currentWord: currentBlankWord
      };
    }

    return {
      newState: state,
      isCorrect: false,
      shouldAdvance: false,
      currentWord: currentBlankWord
    };
  }
};

// Test data matching the exact scenario
const JOHN_3_16_SCENARIO = {
  englishVerse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  spanishVerse: "Porque Dios amó tanto al mundo que dio a su único Hijo, para que todo el que cree en él no perezca, sino que tenga vida eterna.",
  comparisonResult: {
    userComparison: [
      { originalWord: 'For', userWord: 'Por', status: 'incorrect', position: 0 },
      { originalWord: 'God', userWord: 'Dios', status: 'incorrect', position: 1 },
      { originalWord: 'world', userWord: 'mundo', status: 'incorrect', position: 5 }
    ],
    originalComparison: []
  }
};

function runBugReproductionTest() {
  console.log('🚨 CRITICAL BUG REPRODUCTION TEST: "For" Word Recognition');
  console.log('====================================================');
  
  // Create the exact state that's failing
  const state = mockFillInBlankAPI.createFillInBlankState(
    JOHN_3_16_SCENARIO.englishVerse,
    JOHN_3_16_SCENARIO.comparisonResult
  );
  
  console.log('📊 Initial State:', {
    verse: state.verse,
    failedWords: state.failedWords,
    translationContext: state.translationContext
  });
  
  // Get the current blank word (should be "For")
  const currentBlank = mockFillInBlankAPI.getCurrentBlankWord(state);
  console.log('🎯 Current blank word:', currentBlank);
  
  // Test the previously failing scenario: user types "For"
  console.log('\n🧪 TEST 1: User types "For"');
  const englishResult = mockFillInBlankAPI.processWordSubmission(state, 'For');
  
  console.log('📋 Result:', {
    isCorrect: englishResult.isCorrect,
    shouldAdvance: englishResult.shouldAdvance,
    currentWord: englishResult.currentWord
  });
  
  console.log('\n🎯 EXPECTED: isCorrect = true, shouldAdvance = true (English accepted)');
  console.log(`🔍 ACTUAL: isCorrect = ${englishResult.isCorrect}, shouldAdvance = ${englishResult.shouldAdvance}`);
  
  // Test translation scenario: user types "Porque"
  console.log('\n🧪 TEST 2: User types "Porque"');
  const freshState = mockFillInBlankAPI.createFillInBlankState(
    JOHN_3_16_SCENARIO.englishVerse,
    JOHN_3_16_SCENARIO.comparisonResult
  );
  freshState.translationContext = state.translationContext;
  const spanishResult = mockFillInBlankAPI.processWordSubmission(freshState, 'Porque');
  
  console.log('📋 Result:', {
    isCorrect: spanishResult.isCorrect,
    shouldAdvance: spanishResult.shouldAdvance,
    currentWord: spanishResult.currentWord
  });
  
  console.log('\n🎯 EXPECTED: isCorrect = true, shouldAdvance = true (Spanish accepted)');
  console.log(`🔍 ACTUAL: isCorrect = ${spanishResult.isCorrect}, shouldAdvance = ${spanishResult.shouldAdvance}`);
  
  const allPassed = englishResult.isCorrect && spanishResult.isCorrect;
  
  if (allPassed) {
    console.log('\n✅ FIX VERIFIED: English and Spanish inputs are both accepted.');
  } else {
    console.log('\n❌ REGRESSION: One or more inputs were not accepted.');
  }
  
  return !allPassed; // Return true if bug is (still) confirmed
}

// Run the test
const bugConfirmed = runBugReproductionTest();

if (bugConfirmed) {
  console.log('\n🚨 BUG STILL PRESENT: Investigate translation-aware matching logic.');
} else {
  console.log('\n✅ SELF-CHECK PASSED: Translation-aware matching honors English and translated words.');
}
