/**
 * FAILING TEST CASE: Fill-in-Blank Visual Update Bug
 * 
 * This test demonstrates the exact issue described in refresh.md:
 * When a user types a correct word, the blank should visually update 
 * to show the actual word instead of remaining as underscores.
 */

// Simulate the exact conditions from the React component
function simulateFillInBlankDisplay(sessionData, wordsFixed, currentBlankWord) {
    const words = sessionData.verse.text.split(' ');
    
    // Replicate the exact logic from FillInBlankPractice.tsx lines 237-262
    const uniqueFailedWords = new Set(
        sessionData.wrongWords.map(w => 
            (w.originalWord || w.userWord).toLowerCase().replace(/[.,!?;:"']/g, '')
        )
    );
    
    const uniqueCompletedWords = new Set(
        wordsFixed.map(wf => wf.toLowerCase().replace(/[.,!?;:"']/g, ''))
    );
    
    const processedUniqueWords = new Set();
    const result = [];
    
    words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
        
        // FIXED: Only show blank for FIRST occurrence of each unique failed word
        const isUniqueFailedWord = uniqueFailedWords.has(cleanWord);
        const hasBeenProcessed = processedUniqueWords.has(cleanWord);
        const shouldShowBlank = isUniqueFailedWord && !hasBeenProcessed;
        
        if (shouldShowBlank) {
            processedUniqueWords.add(cleanWord); // Mark as processed
        }
        
        const isCompleted = uniqueCompletedWords.has(cleanWord);
        const isCurrentBlank = cleanWord === currentBlankWord?.toLowerCase().replace(/[.,!?;:"']/g, '');
        
        if (shouldShowBlank) {
            if (isCompleted) {
                // GREEN HIGHLIGHT: Completed words - SHOULD SHOW ACTUAL WORD
                result.push({ 
                    type: 'completed', 
                    word: word, 
                    display: word, // This should be the actual word, not underscores
                    index 
                });
            } else if (isCurrentBlank) {
                // PURPLE: Currently active blank
                result.push({ 
                    type: 'current', 
                    word: word, 
                    display: '_____', 
                    index 
                });
            } else {
                // YELLOW: Waiting blanks
                result.push({ 
                    type: 'waiting', 
                    word: word, 
                    display: '_____', 
                    index 
                });
            }
        } else {
            // Regular words
            result.push({ 
                type: 'regular', 
                word: word, 
                display: word, 
                index 
            });
        }
    });
    
    return result;
}

// Test Case: John 3:16 with "eternal" and "life" as failed words
function runFailingTest() {
    console.log('🧪 RUNNING FAILING TEST: Fill-in-Blank Visual Update');
    
    // Test data
    const sessionData = {
        verse: {
            text: "For God so loved the world that he gave his one and only Son that whoever believes in him shall not perish but have eternal life"
        },
        wrongWords: [
            { originalWord: "eternal", userWord: "forever" },
            { originalWord: "life", userWord: "living" }
        ]
    };
    
    console.log('📊 INITIAL STATE:');
    let wordsFixed = [];
    let currentBlankWord = "eternal";
    
    let display = simulateFillInBlankDisplay(sessionData, wordsFixed, currentBlankWord);
    console.log('Display:', display.filter(d => d.type !== 'regular').map(d => `${d.word}(${d.type}:${d.display})`));
    
    // STEP 1: User types "eternal" correctly
    console.log('\n🎯 STEP 1: User types "eternal"');
    wordsFixed = ["eternal"]; // This should trigger visual update
    currentBlankWord = "life"; // Next blank becomes current
    
    display = simulateFillInBlankDisplay(sessionData, wordsFixed, currentBlankWord);
    const eternalDisplay = display.find(d => d.word.toLowerCase().includes('eternal'));
    
    console.log('Expected: eternal should show as COMPLETED with actual word "eternal"');
    console.log('Actual:', eternalDisplay);
    
    // FAILING ASSERTION: This should pass but currently fails
    const testPassed = eternalDisplay && 
                      eternalDisplay.type === 'completed' && 
                      eternalDisplay.display === 'eternal';
    
    console.log('✅ Test Result:', testPassed ? 'PASS' : 'FAIL');
    
    if (!testPassed) {
        console.log('🚨 BUG CONFIRMED: Completed word not displaying actual word');
        console.log('   - Expected display: "eternal"');
        console.log('   - Actual display:', eternalDisplay?.display || 'undefined');
        console.log('   - Type:', eternalDisplay?.type || 'undefined');
    }
    
    // STEP 2: User types "life" correctly  
    console.log('\n🎯 STEP 2: User types "life"');
    wordsFixed = ["eternal", "life"];
    currentBlankWord = null; // No more blanks
    
    display = simulateFillInBlankDisplay(sessionData, wordsFixed, currentBlankWord);
    const lifeDisplay = display.find(d => d.word.toLowerCase().includes('life'));
    
    console.log('Expected: life should show as COMPLETED with actual word "life"');
    console.log('Actual:', lifeDisplay);
    
    const testPassed2 = lifeDisplay && 
                       lifeDisplay.type === 'completed' && 
                       lifeDisplay.display === 'life';
    
    console.log('✅ Test Result:', testPassed2 ? 'PASS' : 'FAIL');
    
    console.log('\n📋 SUMMARY:');
    console.log('Both tests should PASS for the bug to be fixed');
    console.log('Step 1 (eternal):', testPassed ? 'PASS' : 'FAIL');
    console.log('Step 2 (life):', testPassed2 ? 'PASS' : 'FAIL');
    
    return testPassed && testPassed2;
}

// Run the test
const allTestsPassed = runFailingTest();
console.log('\n🎯 FINAL RESULT:', allTestsPassed ? 'ALL TESTS PASS' : 'TESTS FAILING - BUG CONFIRMED');

if (!allTestsPassed) {
    console.log('\n🔍 ROOT CAUSE ANALYSIS NEEDED:');
    console.log('The visual display logic is not properly updating completed blanks to show actual words.');
    console.log('Investigation should focus on:');
    console.log('1. uniqueCompletedWords Set construction');
    console.log('2. isCompleted boolean logic');
    console.log('3. Word matching/comparison logic');
    console.log('4. State synchronization between wordsFixed and display');
}
