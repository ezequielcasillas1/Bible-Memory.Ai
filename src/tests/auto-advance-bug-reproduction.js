/**
 * AUTO-ADVANCE BUG REPRODUCTION TEST
 * 
 * BUG: Automatic word advancement fails - correct words don't advance to next word
 * 
 * Expected: Type correct word → 500ms delay → auto-advance to next blank
 * Actual: Type correct word → nothing happens (no advancement)
 */

console.log('🚨 AUTO-ADVANCE BUG REPRODUCTION TEST');

// Simulate Romans 8:28 scenario from the screenshot
const testScenario = {
  verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  
  // From the screenshot, the blanks appear to be: "know", "things", "good", "those", "love"
  failedWords: ["know", "things", "good", "those", "love"],
  
  // User is currently on first blank: "know"
  currentState: {
    completedWords: [],
    currentBlankWord: "know", // This is what getCurrentBlankWord should return
    userTyping: "know" // User types this exact word
  }
};

console.log('📊 TEST SCENARIO:');
console.log('Verse:', testScenario.verse);
console.log('Failed words (blanks):', testScenario.failedWords);
console.log('Current blank word:', testScenario.currentState.currentBlankWord);
console.log('User types:', testScenario.currentState.userTyping);

// Test the word matching logic used in auto-advance
function testWordMatching(userInput, expectedWord) {
  const cleanUserInput = userInput.trim().toLowerCase().replace(/[.,!?;:"']/g, '');
  const cleanExpectedWord = expectedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
  
  const matches = cleanUserInput === cleanExpectedWord;
  
  console.log(`\n🔍 WORD MATCHING TEST:`);
  console.log(`User input: "${userInput}"`);
  console.log(`Expected word: "${expectedWord}"`);
  console.log(`Clean user input: "${cleanUserInput}"`);
  console.log(`Clean expected word: "${cleanExpectedWord}"`);
  console.log(`Matches: ${matches}`);
  
  return matches;
}

// Test the exact scenario
const shouldMatch = testWordMatching(
  testScenario.currentState.userTyping,
  testScenario.currentState.currentBlankWord
);

console.log(`\n🎯 RESULT: Should trigger auto-advance? ${shouldMatch}`);

if (shouldMatch) {
  console.log('✅ Word matching logic works correctly');
  console.log('🔍 BUG MUST BE ELSEWHERE:');
  console.log('1. currentBlankWord might be null or incorrect');
  console.log('2. isSubmitting state might be blocking advancement');
  console.log('3. handleWordSubmit might not be called');
  console.log('4. Timeout might be cleared before execution');
} else {
  console.log('❌ Word matching logic is broken');
}

console.log('\n🧪 NEXT STEPS:');
console.log('1. Check if currentBlankWord is being set correctly');
console.log('2. Add more console.log statements to track the auto-advance flow');
console.log('3. Verify handleWordSubmit is being called');

export default testScenario;
