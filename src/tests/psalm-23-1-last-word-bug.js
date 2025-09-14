/**
 * PSALM 23:1 LAST WORD SKIPPING BUG REPRODUCTION
 * 
 * BUG: First round skips the last word "nothing" and continues to 2nd round
 * 
 * Psalm 23:1: "The Lord is my shepherd; I shall not want."
 * But user reported it as having "nothing" as last word
 * Could be different translation or verse variation
 */

const psalm23Bug = {
  verse: "The Lord is my shepherd; I shall not want.",
  // Alternative version that might have "nothing":
  alternativeVerse: "The Lord is my shepherd; I lack nothing.",
  
  // Simulate failed words that would become blanks
  failedWords: ["Lord", "shepherd", "lack", "nothing"], // 4 blanks total
  
  // Test the completion logic
  testScenario: {
    round1: {
      step1: { completed: ["Lord"], remaining: ["shepherd", "lack", "nothing"] },
      step2: { completed: ["Lord", "shepherd"], remaining: ["lack", "nothing"] },
      step3: { completed: ["Lord", "shepherd", "lack"], remaining: ["nothing"] },
      step4: { 
        completed: ["Lord", "shepherd", "lack", "nothing"], 
        remaining: [],
        shouldAdvanceToRound2: false, // BUG: This might be triggering early
        expectedBehavior: "Complete round 1 with all 4 words"
      }
    }
  }
};

// Test the isCompleted logic
function testCompletionLogic(completedWords, failedWords) {
  const isCompleted = completedWords.length >= failedWords.length;
  console.log(`Completed: ${completedWords.length}/${failedWords.length} -> isCompleted: ${isCompleted}`);
  return isCompleted;
}

console.log('🐛 PSALM 23:1 LAST WORD SKIPPING BUG TEST');
console.log('Verse:', psalm23Bug.verse);
console.log('Alternative:', psalm23Bug.alternativeVerse);
console.log('Failed words:', psalm23Bug.failedWords);

console.log('\n🧪 TESTING COMPLETION LOGIC:');
testCompletionLogic(["Lord"], psalm23Bug.failedWords); // 1/4 = false ✓
testCompletionLogic(["Lord", "shepherd"], psalm23Bug.failedWords); // 2/4 = false ✓  
testCompletionLogic(["Lord", "shepherd", "lack"], psalm23Bug.failedWords); // 3/4 = false ✓
testCompletionLogic(["Lord", "shepherd", "lack", "nothing"], psalm23Bug.failedWords); // 4/4 = true ✓

console.log('\n🔍 HYPOTHESIS:');
console.log('The isCompleted logic appears correct: 4/4 = true should complete round');
console.log('Bug might be in:');
console.log('1. Word counting - are duplicates being counted?');
console.log('2. State synchronization - are completedWords and failedWords mismatched?');
console.log('3. Timing issue - is completion check happening too early?');
console.log('4. Last word detection - is "nothing" being processed correctly?');

export default psalm23Bug;
