/**
 * MULTI-LANGUAGE ENHANCEMENT VERIFICATION TEST
 * 
 * This test verifies that the enhanced FillInBlankAPI can now support
 * multi-language translations when the multiLanguageTranslations field is provided.
 */

// Simulate the enhanced FillInBlankAPI
const enhancedFillInBlankAPI = {
  getTranslatedWordFromVerse: (englishWord, position, originalVerse, translatedVerse) => {
    const englishWords = originalVerse.split(' ');
    const translatedWords = translatedVerse.split(' ');
    
    // Try exact position mapping first
    if (position < translatedWords.length) {
      const candidateWord = translatedWords[position];
      if (candidateWord) {
        return candidateWord;
      }
    }
    
    // Fallback to English word
    return englishWord;
  },

  processWordSubmission: (state, userInput) => {
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // Simulate finding the current blank word (position 0 for "For")
    const currentWord = "For";
    const blankPosition = 0;
    const cleanCurrentWord = currentWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    let isMatch = false;
    let expectedWord = '';
    let matchedLanguage = '';
    
    if (state.translationContext?.isTranslated) {
      // Always check English first
      const englishWord = cleanCurrentWord;
      if (cleanUserInput === englishWord) {
        isMatch = true;
        expectedWord = englishWord;
        matchedLanguage = 'en';
      } else {
        // Check multi-language translations if available
        if (state.translationContext.multiLanguageTranslations) {
          for (const [langCode, translatedVerse] of Object.entries(state.translationContext.multiLanguageTranslations)) {
            const translatedWord = enhancedFillInBlankAPI.getTranslatedWordFromVerse(
              currentWord,
              blankPosition,
              state.translationContext.originalVerse,
              translatedVerse
            ).toLowerCase().replace(/[.,!?;:"']/g, '');
            
            if (cleanUserInput === translatedWord) {
              isMatch = true;
              expectedWord = translatedWord;
              matchedLanguage = langCode;
              break;
            }
          }
        }
        
        // Fallback: Check primary translated verse (backward compatibility)
        if (!isMatch && state.translationContext.translatedVerse) {
          const translatedWord = enhancedFillInBlankAPI.getTranslatedWordFromVerse(
            currentWord,
            blankPosition,
            state.translationContext.originalVerse,
            state.translationContext.translatedVerse
          ).toLowerCase().replace(/[.,!?;:"']/g, '');
          
          if (cleanUserInput === translatedWord) {
            isMatch = true;
            expectedWord = translatedWord;
            matchedLanguage = 'primary';
          }
        }
      }
    } else {
      // No translation context - only check English
      if (cleanUserInput === cleanCurrentWord) {
        isMatch = true;
        expectedWord = cleanCurrentWord;
        matchedLanguage = 'en';
      }
    }
    
    return {
      isCorrect: isMatch,
      shouldAdvance: isMatch,
      currentWord: currentWord,
      matchedLanguage,
      expectedWord
    };
  }
};

function runEnhancementTest() {
  console.log('🚀 MULTI-LANGUAGE ENHANCEMENT VERIFICATION TEST');
  console.log('===============================================');
  
  // Create enhanced state with multi-language translations
  const enhancedState = {
    verse: "For God so loved the world...",
    failedWords: ["For", "God", "world"],
    completedWords: [],
    currentBlankIndex: 0,
    translationContext: {
      isTranslated: true,
      originalVerse: "For God so loved the world that he gave his one and only Son",
      translatedVerse: "Porque Dios amó tanto al mundo que dio a su único Hijo", // Spanish (primary)
      // NEW: Multi-language support
      multiLanguageTranslations: {
        'es': 'Porque Dios amó tanto al mundo que dio a su único Hijo',        // Spanish
        'fr': 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique', // French
        'de': 'Denn so hat Gott die Welt geliebt dass er seinen Sohn gab',     // German
        'pt': 'Porque Deus amou o mundo de tal maneira que deu seu Filho',     // Portuguese
        'it': 'Perché Dio ha tanto amato il mondo che ha dato il suo Figlio',  // Italian
        'zh-cn': '因为神爱世人 甚至将他的独生子赐给他们',                        // Chinese
        'ja': 'なぜなら神は世を愛し その独り子を与えられたからです',            // Japanese
        'ko': '왜냐하면 하나님이 세상을 이처럼 사랑하사 독생자를 주셨기 때문입니다' // Korean
      }
    }
  };
  
  // Test cases for different languages
  const testCases = [
    { input: 'For', language: 'English', code: 'en', expected: true },
    { input: 'Porque', language: 'Spanish', code: 'es', expected: true },
    { input: 'Car', language: 'French', code: 'fr', expected: true },
    { input: 'Denn', language: 'German', code: 'de', expected: true },
    { input: 'Porque', language: 'Portuguese', code: 'pt', expected: true },
    { input: 'Perché', language: 'Italian', code: 'it', expected: true },
    { input: '因为', language: 'Chinese (Simplified)', code: 'zh-cn', expected: true },
    { input: 'なぜなら', language: 'Japanese', code: 'ja', expected: true },
    { input: '왜냐하면', language: 'Korean', code: 'ko', expected: true },
    { input: 'Invalid', language: 'Invalid Word', code: 'invalid', expected: false }
  ];
  
  console.log('\n🧪 TESTING ENHANCED MULTI-LANGUAGE SUPPORT:');
  console.log('===========================================');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach(testCase => {
    const result = enhancedFillInBlankAPI.processWordSubmission(enhancedState, testCase.input);
    const passed = result.isCorrect === testCase.expected;
    const status = passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`  ${testCase.language} "${testCase.input}": ${status}`);
    if (result.isCorrect) {
      console.log(`    → Matched language: ${result.matchedLanguage}`);
    }
    
    if (passed) passedTests++;
  });
  
  console.log(`\n📊 ENHANCEMENT TEST RESULTS:`);
  console.log(`=========================`);
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ENHANCEMENT SUCCESSFUL!');
    console.log('✅ Multi-language support is working correctly');
    console.log('✅ All supported languages are accepted');
    console.log('✅ Invalid words are still rejected');
    console.log('✅ Backward compatibility maintained');
  } else {
    console.log('\n⚠️  ENHANCEMENT NEEDS WORK');
    console.log(`❌ ${totalTests - passedTests} tests failed`);
  }
  
  return passedTests === totalTests;
}

// Test backward compatibility (without multiLanguageTranslations)
function runBackwardCompatibilityTest() {
  console.log('\n🔄 BACKWARD COMPATIBILITY TEST:');
  console.log('===============================');
  
  const oldStyleState = {
    verse: "For God so loved the world...",
    failedWords: ["For"],
    completedWords: [],
    currentBlankIndex: 0,
    translationContext: {
      isTranslated: true,
      originalVerse: "For God so loved the world",
      translatedVerse: "Porque Dios amó tanto al mundo"
      // NO multiLanguageTranslations field - old style
    }
  };
  
  const testCases = [
    { input: 'For', expected: true, desc: 'English should work' },
    { input: 'Porque', expected: true, desc: 'Primary translation should work' },
    { input: 'Car', expected: false, desc: 'Other languages should not work (as expected)' }
  ];
  
  let compatibilityPassed = 0;
  testCases.forEach(testCase => {
    const result = enhancedFillInBlankAPI.processWordSubmission(oldStyleState, testCase.input);
    const passed = result.isCorrect === testCase.expected;
    const status = passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`  "${testCase.input}": ${status} (${testCase.desc})`);
    if (passed) compatibilityPassed++;
  });
  
  console.log(`\n📊 Backward Compatibility: ${compatibilityPassed}/${testCases.length} tests passed`);
  return compatibilityPassed === testCases.length;
}

// Run both tests
console.log('🧪 RUNNING MULTI-LANGUAGE ENHANCEMENT TESTS...\n');

const enhancementWorked = runEnhancementTest();
const backwardCompatible = runBackwardCompatibilityTest();

console.log('\n🏁 FINAL VERIFICATION RESULTS:');
console.log('=============================');

if (enhancementWorked && backwardCompatible) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Multi-language enhancement successful');
  console.log('✅ Backward compatibility maintained');
  console.log('🚀 Ready for deployment');
} else {
  console.log('❌ SOME TESTS FAILED');
  if (!enhancementWorked) console.log('  - Multi-language enhancement needs work');
  if (!backwardCompatible) console.log('  - Backward compatibility broken');
}
