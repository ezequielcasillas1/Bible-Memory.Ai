/**
 * WORD SKIPPING BUG TEST
 * 
 * This test reproduces the exact bug where words are skipped in fill-in-blank progression.
 * Based on the screenshot showing John 3:16 where "only" appears to be skipped.
 */

console.log('🐛 WORD SKIPPING BUG REPRODUCTION TEST');
console.log('='.repeat(50));

// Simulate John 3:16 scenario from screenshot
function reproduceWordSkippingBug() {
    // From screenshot: "loved" and "that" are completed, next should be "only"
    const johnVerse = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
    
    // Failed words from the screenshot (visible blanks)
    const failedWords = ["loved", "world", "that", "gave", "only", "perish", "eternal", "life"];
    
    console.log('📋 TEST SCENARIO:');
    console.log(`Verse: ${johnVerse}`);
    console.log(`Failed words: [${failedWords.join(', ')}]`);
    console.log('');
    
    // Simulate progression states
    const progressionStates = [
        { step: 1, completed: [], expected: "loved" },
        { step: 2, completed: ["loved"], expected: "world" },
        { step: 3, completed: ["loved", "that"], expected: "world" }, // BUG: Should be "world" but might skip
    ];
    
    progressionStates.forEach(state => {
        console.log(`🔍 STEP ${state.step}: ${state.completed.length} words completed`);
        
        // COMPONENT LOGIC: currentBlankIndex = wordsFixed.length
        const componentIndex = state.completed.length;
        
        // API LOGIC: Simulate what happens after word submission
        // API increments: currentBlankIndex = state.currentBlankIndex + 1
        const previousApiIndex = state.completed.length > 0 ? state.completed.length - 1 : 0;
        const apiIndex = previousApiIndex + 1;
        
        console.log(`  Component sets index to: ${componentIndex}`);
        console.log(`  API would set index to: ${apiIndex}`);
        
        // Find remaining failed words
        const remainingWords = failedWords.filter(word => 
            !state.completed.some(completed => 
                completed.toLowerCase().replace(/[.,!?;:"']/g, '') === word.toLowerCase().replace(/[.,!?;:"']/g, '')
            )
        );
        
        console.log(`  Remaining words: [${remainingWords.join(', ')}]`);
        
        // Test both index calculations
        const componentResult = remainingWords[componentIndex] || 'INDEX_OUT_OF_BOUNDS';
        const apiResult = remainingWords[apiIndex] || 'INDEX_OUT_OF_BOUNDS';
        
        console.log(`  Component index ${componentIndex} → "${componentResult}"`);
        console.log(`  API index ${apiIndex} → "${apiResult}"`);
        console.log(`  Expected: "${state.expected}"`);
        
        // Check for bug
        const componentCorrect = componentResult === state.expected;
        const apiCorrect = apiResult === state.expected;
        
        if (!componentCorrect && !apiCorrect) {
            console.log('  🚨 BUG DETECTED: Neither calculation gives correct result');
        } else if (componentCorrect && !apiCorrect) {
            console.log('  ⚠️ API INDEX MISMATCH: Component correct, API skips words');
        } else if (!componentCorrect && apiCorrect) {
            console.log('  ⚠️ COMPONENT INDEX MISMATCH: API correct, component skips words');
        } else {
            console.log('  ✅ Both calculations correct');
        }
        
        console.log('');
    });
}

// Test the exact screenshot scenario
function testScreenshotScenario() {
    console.log('📸 SCREENSHOT SCENARIO TEST:');
    console.log('Current state: "loved" ✅ and "that" ✅ completed');
    console.log('Expected next: "world" (the word after "so")');
    console.log('');
    
    const completedWords = ["loved", "that"];
    const failedWords = ["loved", "world", "that", "gave", "only", "perish", "eternal", "life"];
    
    // Component calculation
    const componentIndex = completedWords.length; // = 2
    
    // Find remaining words (excluding completed ones)
    const remainingWords = failedWords.filter(word => 
        !completedWords.includes(word.toLowerCase())
    );
    
    console.log(`Completed: [${completedWords.join(', ')}]`);
    console.log(`Failed words: [${failedWords.join(', ')}]`);
    console.log(`Remaining: [${remainingWords.join(', ')}]`);
    console.log(`Component index: ${componentIndex}`);
    console.log(`remainingWords[${componentIndex}] = "${remainingWords[componentIndex] || 'OUT_OF_BOUNDS'}"`);
    
    const expectedNext = "world"; // Should be "world" as it's the first uncompleted failed word
    const actualNext = remainingWords[componentIndex] || 'OUT_OF_BOUNDS';
    
    if (actualNext === expectedNext) {
        console.log(`✅ CORRECT: Next word is "${actualNext}"`);
        return false; // No bug
    } else {
        console.log(`🚨 BUG CONFIRMED: Expected "${expectedNext}", got "${actualNext}"`);
        console.log('This explains why words are being skipped!');
        return true; // Bug confirmed
    }
}

// Run tests
reproduceWordSkippingBug();
console.log('='.repeat(50));
const hasBug = testScreenshotScenario();

console.log('\n📊 FINAL ANALYSIS:');
if (hasBug) {
    console.log('🐛 WORD SKIPPING BUG CONFIRMED');
    console.log('💡 ROOT CAUSE: Index calculation mismatch between component and API');
    console.log('🔧 SOLUTION NEEDED: Synchronize currentBlankIndex logic');
} else {
    console.log('✅ No bug detected in this test scenario');
    console.log('🔍 May need different test conditions');
}


