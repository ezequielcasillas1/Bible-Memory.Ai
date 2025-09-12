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
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // Find the current blank word
    const currentBlankWord = mockFillInBlankAPI.getCurrentBlankWord(state);
    if (!currentBlankWord) {
      return {
        newState: state,
        isCorrect: false,
        shouldAdvance: false,
        currentWord: null
      };
    }
    
    let wordToCheck = currentBlankWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    // TRANSLATION-AWARE COMPARISON (this is where the bug likely is)
    if (state.translationContext?.isTranslated) {
      // This is the critical logic that may be broken
      const originalWords = state.translationContext.originalVerse.split(' ');
      const translatedWords = state.translationContext.translatedVerse.split(' ');
      
      // Find position of current word in original verse
      const originalPosition = originalWords.findIndex(w => 
        w.toLowerCase().replace(/[.,!?;:"']/g, '') === currentBlankWord.toLowerCase().replace(/[.,!?;:"']/g, '')
      );
      
      if (originalPosition >= 0 && originalPosition < translatedWords.length) {
        const translatedWord = translatedWords[originalPosition];
        wordToCheck = translatedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
        
        console.log('🌍 TRANSLATION DEBUG:', {
          currentBlankWord,
          originalPosition,
          translatedWord,
          wordToCheck,
          userInput: cleanUserInput,
          matches: cleanUserInput === wordToCheck
        });
      }
    }
    
    const isCorrect = cleanUserInput === wordToCheck;
    
    if (isCorrect) {
      const newCompletedWords = [...state.completedWords, currentBlankWord];
      return {
        newState: { ...state, completedWords: newCompletedWords },
        isCorrect: true,
        shouldAdvance: true,
        currentWord: currentBlankWord
      };
    } else {
      return {
        newState: state,
        isCorrect: false,
        shouldAdvance: false,
        currentWord: currentBlankWord
      };
    }
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
  
  // Test the failing scenario: user types "For"
  console.log('\n🧪 TESTING: User types "For"');
  const result = mockFillInBlankAPI.processWordSubmission(state, 'For');
  
  console.log('📋 Result:', {
    isCorrect: result.isCorrect,
    shouldAdvance: result.shouldAdvance,
    currentWord: result.currentWord
  });
  
  // Expected vs Actual
  console.log('\n🎯 EXPECTED: isCorrect = true, shouldAdvance = true');
  console.log(`🔍 ACTUAL: isCorrect = ${result.isCorrect}, shouldAdvance = ${result.shouldAdvance}`);
  
  if (result.isCorrect) {
    console.log('✅ TEST PASSED: "For" was correctly recognized');
  } else {
    console.log('❌ TEST FAILED: "For" was NOT recognized as correct');
    console.log('🚨 BUG CONFIRMED: This reproduces the reported issue');
  }
  
  // Additional debugging
  console.log('\n🔍 TRANSLATION MAPPING DEBUG:');
  const originalWords = state.translationContext.originalVerse.split(' ');
  const translatedWords = state.translationContext.translatedVerse.split(' ');
  
  console.log('Position 0 (should be "For" → "Porque"):');
  console.log(`  English: "${originalWords[0]}"`);
  console.log(`  Spanish: "${translatedWords[0]}"`);
  console.log(`  User typed: "For"`);
  console.log(`  Should match: "${originalWords[0]}" (English) or "${translatedWords[0]}" (Spanish)`);
  
  return !result.isCorrect; // Return true if bug is confirmed
}

// Run the test
const bugConfirmed = runBugReproductionTest();

if (bugConfirmed) {
  console.log('\n🚨 BUG REPRODUCTION SUCCESSFUL');
  console.log('The "For" word recognition failure has been isolated and reproduced.');
  console.log('Ready for Root Cause Analysis phase.');
} else {
  console.log('\n✅ No bug found in this test');
  console.log('The logic appears to work correctly in isolation.');
}
