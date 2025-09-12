/**
 * TARGETED TEST: React State Timing Issue
 * 
 * This test simulates the exact React state update flow to identify
 * if the issue is in state synchronization or component re-rendering.
 */

// Simulate React useState behavior
function createReactState(initialValue) {
    let value = initialValue;
    const setState = (newValue) => {
        console.log(`📊 State Update: ${JSON.stringify(value)} → ${JSON.stringify(newValue)}`);
        value = newValue;
        // Simulate React re-render
        setTimeout(() => {
            console.log(`🔄 Re-render triggered with state: ${JSON.stringify(value)}`);
        }, 0);
    };
    const getState = () => value;
    return [getState, setState];
}

// Simulate the exact FillInBlankPractice component logic
function simulateReactComponent(sessionData, wordsFixedState) {
    console.log('🔍 COMPONENT RENDER - Checking visual display logic');
    
    const wordsFixed = wordsFixedState;
    const words = sessionData.verse.text.split(' ');
    
    // Exact logic from FillInBlankPractice.tsx lines 237-245
    const uniqueFailedWords = new Set(
        sessionData.wrongWords.map(w => 
            (w.originalWord || w.userWord).toLowerCase().replace(/[.,!?;:"']/g, '')
        )
    );
    
    const uniqueCompletedWords = new Set(
        wordsFixed.map(wf => wf.toLowerCase().replace(/[.,!?;:"']/g, ''))
    );
    
    console.log('🎯 State Analysis:');
    console.log('  - wordsFixed array:', wordsFixed);
    console.log('  - uniqueFailedWords Set:', Array.from(uniqueFailedWords));
    console.log('  - uniqueCompletedWords Set:', Array.from(uniqueCompletedWords));
    
    // Check the key word: "eternal"
    const eternalWord = "eternal";
    const cleanEternalWord = eternalWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    const isUniqueFailedWord = uniqueFailedWords.has(cleanEternalWord);
    const isCompleted = uniqueCompletedWords.has(cleanEternalWord);
    
    console.log('🔬 "eternal" Analysis:');
    console.log(`  - isUniqueFailedWord: ${isUniqueFailedWord}`);
    console.log(`  - isCompleted: ${isCompleted}`);
    console.log(`  - Should show as completed: ${isUniqueFailedWord && isCompleted}`);
    
    if (isUniqueFailedWord && isCompleted) {
        console.log('✅ EXPECTED: "eternal" should display as GREEN with actual word');
        return 'SUCCESS';
    } else if (isUniqueFailedWord && !isCompleted) {
        console.log('❌ BUG: "eternal" should display as blank/current');
        return 'BUG_DETECTED';
    } else {
        console.log('⚠️ UNEXPECTED: "eternal" not recognized as failed word');
        return 'CONFIGURATION_ERROR';
    }
}

// Test the exact scenario from refresh.md
function testStateTimingIssue() {
    console.log('🧪 TESTING: React State Timing Issue');
    console.log('Scenario: User types "eternal" correctly in John 3:16\n');
    
    const sessionData = {
        verse: {
            text: "For God so loved the world that he gave his one and only Son that whoever believes in him shall not perish but have eternal life"
        },
        wrongWords: [
            { originalWord: "eternal", userWord: "forever" },
            { originalWord: "life", userWord: "living" }
        ]
    };
    
    // Simulate React useState
    const [getWordsFixed, setWordsFixed] = createReactState([]);
    
    console.log('📊 INITIAL STATE:');
    let result1 = simulateReactComponent(sessionData, getWordsFixed());
    console.log(`Result: ${result1}\n`);
    
    console.log('🎯 USER ACTION: Types "eternal" correctly');
    console.log('📊 STATE UPDATE: Adding "eternal" to wordsFixed');
    
    // This simulates the exact code from SyntaxLabPage.tsx line 196-197:
    // const newWordsFixed = [...wordsFixed, result.currentWord || ''];
    // setWordsFixed(newWordsFixed);
    const currentWordsFixed = getWordsFixed();
    const newWordsFixed = [...currentWordsFixed, "eternal"];
    setWordsFixed(newWordsFixed);
    
    console.log('\n📊 AFTER STATE UPDATE:');
    let result2 = simulateReactComponent(sessionData, getWordsFixed());
    console.log(`Result: ${result2}\n`);
    
    // Test the critical timing
    console.log('🔍 CRITICAL TEST: Is the issue in state timing?');
    if (result1 === 'BUG_DETECTED' && result2 === 'SUCCESS') {
        console.log('✅ STATE TIMING IS CORRECT - Issue must be elsewhere');
        return false; // No timing bug
    } else if (result2 === 'BUG_DETECTED') {
        console.log('🚨 STATE TIMING BUG CONFIRMED - wordsFixed not updating correctly');
        return true; // Timing bug confirmed
    } else {
        console.log('⚠️ UNEXPECTED RESULTS - Need deeper investigation');
        return null; // Unclear
    }
}

// Run the test
console.log('='.repeat(60));
const hasTimingBug = testStateTimingIssue();
console.log('='.repeat(60));

if (hasTimingBug === true) {
    console.log('🎯 ROOT CAUSE: React state timing issue');
    console.log('💡 SOLUTION: Fix state synchronization or force re-render');
} else if (hasTimingBug === false) {
    console.log('🎯 ROOT CAUSE: Not a state timing issue');
    console.log('💡 INVESTIGATION: Look at component re-rendering or visual display logic');
} else {
    console.log('🎯 ROOT CAUSE: Unclear - need more investigation');
}
