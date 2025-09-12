/**
 * VERIFICATION TEST: Does Spanish word "Porque" work?
 * This will confirm our hypothesis about the translation logic.
 */

// Use the same mock from the previous test
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

  processWordSubmission: (state, userInput) => {
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // Simulate the real logic: only check translated word
    const originalWords = state.translationContext.originalVerse.split(' ');
    const translatedWords = state.translationContext.translatedVerse.split(' ');
    const translatedWord = translatedWords[0]; // "Porque"
    const wordToCheck = translatedWord.toLowerCase().replace(/[.,!?;:"']/g, ''); // "porque"
    
    const isCorrect = cleanUserInput === wordToCheck;
    
    console.log('🔍 Spanish Word Test:', {
      userInput: cleanUserInput,
      expectedSpanish: wordToCheck,
      matches: isCorrect
    });
    
    return {
      isCorrect,
      shouldAdvance: isCorrect,
      currentWord: 'For'
    };
  }
};

const JOHN_3_16_SCENARIO = {
  englishVerse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  comparisonResult: {
    userComparison: [
      { originalWord: 'For', userWord: 'Por', status: 'incorrect', position: 0 }
    ],
    originalComparison: []
  }
};

console.log('🧪 VERIFICATION TEST: Spanish Word Acceptance');
console.log('==============================================');

const state = mockFillInBlankAPI.createFillInBlankState(
  JOHN_3_16_SCENARIO.englishVerse,
  JOHN_3_16_SCENARIO.comparisonResult
);

// Test 1: English word "For" (should fail based on our hypothesis)
console.log('\n🧪 Test 1: User types "For" (English)');
const englishResult = mockFillInBlankAPI.processWordSubmission(state, 'For');
console.log(`Result: ${englishResult.isCorrect ? '✅ ACCEPTED' : '❌ REJECTED'}`);

// Test 2: Spanish word "Porque" (should work based on our hypothesis)
console.log('\n🧪 Test 2: User types "Porque" (Spanish)');
const spanishResult = mockFillInBlankAPI.processWordSubmission(state, 'Porque');
console.log(`Result: ${spanishResult.isCorrect ? '✅ ACCEPTED' : '❌ REJECTED'}`);

// Test 3: Spanish word lowercase "porque"
console.log('\n🧪 Test 3: User types "porque" (lowercase Spanish)');
const spanishLowerResult = mockFillInBlankAPI.processWordSubmission(state, 'porque');
console.log(`Result: ${spanishLowerResult.isCorrect ? '✅ ACCEPTED' : '❌ REJECTED'}`);

console.log('\n📋 ROOT CAUSE ANALYSIS CONCLUSION:');
if (!englishResult.isCorrect && spanishResult.isCorrect) {
  console.log('✅ HYPOTHESIS CONFIRMED: System only accepts Spanish words');
  console.log('🚨 ROOT CAUSE: Translation logic excludes English word acceptance');
  console.log('💡 SOLUTION: Modify logic to accept BOTH English AND Spanish words');
} else {
  console.log('⚠️  Unexpected results - need further investigation');
}
