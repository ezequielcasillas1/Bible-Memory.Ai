/**
 * ROMANS 8:28 "KNOW" VALIDATION BUG REPRODUCTION
 * 
 * BUG: User types "know" (correct) but system shows "X" (wrong)
 * Expected: User types "know" → show ✅ → advance to next word
 * Actual: User types "know" → show ❌ → doesn't advance
 */

console.log('🚨 ROMANS 8:28 "KNOW" VALIDATION BUG TEST');

// Romans 8:28 text
const romans828 = "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.";

// Simulate the failed words that would create blanks
// Based on the screenshot, these appear to be the blanks
const simulatedFailedWords = ["know", "things", "God", "good", "those"];

console.log('📊 ROMANS 8:28 TEST SCENARIO:');
console.log('Verse:', romans828);
console.log('Failed words (blanks):', simulatedFailedWords);

// Test the word validation logic
function testWordValidation(userInput, expectedWord, failedWords) {
  console.log(`\n🔍 TESTING WORD VALIDATION:`);
  console.log(`User input: "${userInput}"`);
  console.log(`Expected word: "${expectedWord}"`);
  console.log(`Failed words list: [${failedWords.join(', ')}]`);
  
  // This is the logic from SyntaxLabPage.tsx lines 207-215
  const cleanUserInput = userInput.toLowerCase().replace(/[.,!?;:"']/g, '');
  const matchingFailedWord = failedWords.find(fw => 
    fw.toLowerCase().replace(/[.,!?;:"']/g, '') === cleanUserInput
  );
  
  // Direct match check (this should work)
  const isDirectMatch = !!matchingFailedWord;
  
  console.log(`Clean user input: "${cleanUserInput}"`);
  console.log(`Matching failed word: "${matchingFailedWord}"`);
  console.log(`Direct match: ${isDirectMatch}`);
  
  // The API result would come from FillInBlankAPI.processWordSubmission()
  // Let's simulate what that might return
  const mockApiResult = {
    isCorrect: false, // This is probably the bug - API returning false incorrectly
    shouldAdvance: false,
    currentWord: expectedWord
  };
  
  const finalIsCorrect = mockApiResult.isCorrect || isDirectMatch;
  
  console.log(`API result (mocked): isCorrect = ${mockApiResult.isCorrect}`);
  console.log(`Final is correct: ${finalIsCorrect}`);
  
  return {
    directMatch: isDirectMatch,
    apiResult: mockApiResult.isCorrect,
    finalResult: finalIsCorrect
  };
}

// Test the exact scenario: user types "know"
const testResult = testWordValidation("know", "know", simulatedFailedWords);

console.log(`\n🎯 DIAGNOSIS:`);
if (testResult.directMatch && !testResult.apiResult) {
  console.log('✅ Direct match works correctly');
  console.log('❌ API validation is broken - returning false for correct words');
  console.log('🔍 BUG LOCATION: FillInBlankAPI.processWordSubmission() method');
} else if (!testResult.directMatch) {
  console.log('❌ Direct match is broken - failed words list is incorrect');
  console.log('🔍 BUG LOCATION: Failed words extraction or session creation');
} else {
  console.log('✅ Both validations work - bug might be elsewhere');
}

console.log(`\n🧪 EXPECTED BEHAVIOR:`);
console.log('1. User types "know"');
console.log('2. Direct match finds "know" in failed words list');
console.log('3. API validation also returns true');
console.log('4. finalIsCorrect = true');
console.log('5. Show ✅ emoji and advance to next word');

console.log(`\n🐛 ACTUAL BEHAVIOR (SUSPECTED):`);
console.log('1. User types "know"');
console.log('2. Direct match finds "know" in failed words list ✅');
console.log('3. API validation incorrectly returns false ❌');
console.log('4. finalIsCorrect = true (because of direct match)');
console.log('5. Should still show ✅ but something else is causing ❌');

export default { romans828, simulatedFailedWords, testResult };
