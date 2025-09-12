/**
 * MULTI-LANGUAGE FILL-IN-BLANK TEST
 * 
 * This test demonstrates the current limitation where users can only
 * type correct answers in English + ONE translated language, but not
 * in any of the other 16+ supported languages.
 */

// Simulate the current single-language translation context
const currentSingleLanguageAPI = {
  processWordSubmission: (state, userInput) => {
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // CURRENT LIMITATION: Only supports English + ONE translation language
    if (state.translationContext?.isTranslated) {
      const englishWord = "for";
      const singleTranslatedWord = "porque"; // Only Spanish supported
      
      const isMatch = (cleanUserInput === englishWord) || (cleanUserInput === singleTranslatedWord);
      
      return {
        isCorrect: isMatch,
        supportedLanguages: ['en', 'es'], // Only 2 out of 18 languages
        testedWord: cleanUserInput
      };
    }
    
    // Non-translation: only English
    return {
      isCorrect: cleanUserInput === "for",
      supportedLanguages: ['en'],
      testedWord: cleanUserInput
    };
  }
};

// Simulate what a multi-language API SHOULD support
const idealMultiLanguageAPI = {
  // John 3:16 "For" translations in multiple languages
  multiLanguageTranslations: {
    'en': 'for',           // English
    'es': 'porque',        // Spanish  
    'fr': 'car',           // French
    'de': 'denn',          // German
    'pt': 'porque',        // Portuguese
    'it': 'perché',        // Italian
    'nl': 'want',          // Dutch
    'zh-cn': '因为',        // Chinese (Simplified)
    'zh-tw': '因為',        // Chinese (Traditional)
    'ja': 'なぜなら',       // Japanese
    'ko': '왜냐하면',       // Korean
    'hi': 'क्योंकि',        // Hindi
    'sw': 'kwa',           // Swahili
    'tl': 'dahil',         // Tagalog
    'vi': 'vì',            // Vietnamese
    'th': 'เพราะ',          // Thai
    'ms': 'kerana',        // Malay
    'id': 'karena'         // Indonesian
  },
  
  processWordSubmission: (userInput) => {
    const cleanUserInput = userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '');
    
    // Check against ALL supported language translations
    const matchedLanguages = [];
    for (const [langCode, translation] of Object.entries(idealMultiLanguageAPI.multiLanguageTranslations)) {
      if (cleanUserInput === translation.toLowerCase()) {
        matchedLanguages.push(langCode);
      }
    }
    
    return {
      isCorrect: matchedLanguages.length > 0,
      matchedLanguages,
      supportedLanguages: Object.keys(idealMultiLanguageAPI.multiLanguageTranslations),
      testedWord: cleanUserInput
    };
  }
};

function runMultiLanguageTest() {
  console.log('🌍 MULTI-LANGUAGE FILL-IN-BLANK TEST');
  console.log('====================================');
  
  // Test words in different languages for John 3:16 "For"
  const testCases = [
    { input: 'For', language: 'English', code: 'en' },
    { input: 'porque', language: 'Spanish', code: 'es' },
    { input: 'car', language: 'French', code: 'fr' },
    { input: 'denn', language: 'German', code: 'de' },
    { input: 'perché', language: 'Italian', code: 'it' },
    { input: '因为', language: 'Chinese (Simplified)', code: 'zh-cn' },
    { input: 'なぜなら', language: 'Japanese', code: 'ja' },
    { input: 'क्योंकि', language: 'Hindi', code: 'hi' },
    { input: 'vì', language: 'Vietnamese', code: 'vi' }
  ];
  
  console.log('\n🧪 CURRENT SYSTEM (Limited Support):');
  console.log('=====================================');
  
  const mockState = {
    translationContext: {
      isTranslated: true,
      originalVerse: "For God so loved the world...",
      translatedVerse: "Porque Dios amó tanto al mundo..."
    }
  };
  
  let currentSystemPassed = 0;
  testCases.forEach(testCase => {
    const result = currentSingleLanguageAPI.processWordSubmission(mockState, testCase.input);
    const status = result.isCorrect ? '✅ ACCEPTED' : '❌ REJECTED';
    console.log(`  ${testCase.language} "${testCase.input}": ${status}`);
    if (result.isCorrect) currentSystemPassed++;
  });
  
  console.log(`\n📊 Current System Results: ${currentSystemPassed}/${testCases.length} languages supported`);
  
  console.log('\n🎯 IDEAL SYSTEM (Full Multi-Language Support):');
  console.log('==============================================');
  
  let idealSystemPassed = 0;
  testCases.forEach(testCase => {
    const result = idealMultiLanguageAPI.processWordSubmission(testCase.input);
    const status = result.isCorrect ? '✅ ACCEPTED' : '❌ REJECTED';
    console.log(`  ${testCase.language} "${testCase.input}": ${status}`);
    if (result.isCorrect) idealSystemPassed++;
  });
  
  console.log(`\n📊 Ideal System Results: ${idealSystemPassed}/${testCases.length} languages supported`);
  
  // ANOMALY ISOLATION
  console.log('\n🚨 ANOMALY IDENTIFIED:');
  console.log('======================');
  
  const supportGap = idealSystemPassed - currentSystemPassed;
  console.log(`❌ CURRENT LIMITATION: Only ${currentSystemPassed}/18 languages supported`);
  console.log(`✅ REQUIRED ENHANCEMENT: Support all ${idealSystemPassed}/18 languages`);
  console.log(`🎯 GAP TO CLOSE: ${supportGap} additional languages need support`);
  
  console.log('\n🔍 SPECIFIC FAILING CASES:');
  testCases.forEach(testCase => {
    const currentResult = currentSingleLanguageAPI.processWordSubmission(mockState, testCase.input);
    const idealResult = idealMultiLanguageAPI.processWordSubmission(testCase.input);
    
    if (!currentResult.isCorrect && idealResult.isCorrect) {
      console.log(`  ❌ ${testCase.language} "${testCase.input}" should be accepted but is rejected`);
    }
  });
  
  return supportGap > 0; // Return true if there's a gap (anomaly confirmed)
}

// Run the test
console.log('🧪 RUNNING MULTI-LANGUAGE ANOMALY ISOLATION TEST...\n');

const anomalyConfirmed = runMultiLanguageTest();

if (anomalyConfirmed) {
  console.log('\n🚨 MULTI-LANGUAGE ANOMALY CONFIRMED');
  console.log('✅ Reproducible test case created');
  console.log('🎯 Ready for Root Cause Analysis phase');
} else {
  console.log('\n✅ No multi-language anomaly detected');
  console.log('Current system appears to support all required languages');
}
