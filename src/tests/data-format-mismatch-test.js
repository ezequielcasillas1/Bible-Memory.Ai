/**
 * DATA FORMAT MISMATCH TEST
 * 
 * This test checks if there's a mismatch between the format of data 
 * stored in wordsFixed vs. what's expected in the visual display logic.
 */

// Simulate the exact FillInBlankAPI.processWordSubmission logic
function simulateProcessWordSubmission(userInput, expectedWord) {
    console.log(`🎯 Processing word submission: "${userInput}" for expected "${expectedWord}"`);
    
    // From fillInBlankService.ts line 295-296:
    // const cleanMatchedWord = matchedBlank.word.toLowerCase().replace(/[.,!?;:"']/g, '');
    // const wordToStore = state.translationContext?.isTranslated ? expectedWord : cleanMatchedWord;
    
    const cleanMatchedWord = expectedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    const wordToStore = cleanMatchedWord; // No translation context for this test
    
    console.log(`📊 Word stored in wordsFixed: "${wordToStore}"`);
    
    return {
        isCorrect: userInput.toLowerCase().trim() === expectedWord.toLowerCase().trim(),
        currentWord: wordToStore
    };
}

// Simulate the exact visual display logic from FillInBlankPractice.tsx
function simulateVisualDisplay(verseText, wordsFixed, failedWords) {
    console.log('🔍 Visual Display Simulation');
    
    const words = verseText.split(' ');
    
    // From FillInBlankPractice.tsx lines 237-245
    const uniqueFailedWords = new Set(
        failedWords.map(fw => fw.toLowerCase().replace(/[.,!?;:"']/g, ''))
    );
    
    const uniqueCompletedWords = new Set(
        wordsFixed.map(wf => wf.toLowerCase().replace(/[.,!?;:"']/g, ''))
    );
    
    console.log('📊 Visual Display State:');
    console.log('  - uniqueFailedWords:', Array.from(uniqueFailedWords));
    console.log('  - wordsFixed array:', wordsFixed);
    console.log('  - uniqueCompletedWords:', Array.from(uniqueCompletedWords));
    
    const results = [];
    const processedUniqueWords = new Set();
    
    words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
        
        const isUniqueFailedWord = uniqueFailedWords.has(cleanWord);
        const hasBeenProcessed = processedUniqueWords.has(cleanWord);
        const shouldShowBlank = isUniqueFailedWord && !hasBeenProcessed;
        
        if (shouldShowBlank) {
            processedUniqueWords.add(cleanWord);
        }
        
        const isCompleted = uniqueCompletedWords.has(cleanWord);
        
        if (shouldShowBlank) {
            if (isCompleted) {
                results.push({
                    word,
                    cleanWord,
                    display: 'COMPLETED_GREEN',
                    shouldShowActualWord: true
                });
            } else {
                results.push({
                    word,
                    cleanWord,
                    display: 'BLANK_UNDERSCORES',
                    shouldShowActualWord: false
                });
            }
        }
    });
    
    return results;
}

// Test the exact John 3:16 scenario
function testDataFormatMismatch() {
    console.log('🧪 TESTING: Data Format Mismatch');
    console.log('Scenario: John 3:16 - "eternal life" at the end\n');
    
    const verseText = "For God so loved the world that he gave his one and only Son that whoever believes in him shall not perish but have eternal life";
    const failedWords = ["eternal", "life"];
    
    console.log('📊 INITIAL STATE:');
    let wordsFixed = [];
    let display = simulateVisualDisplay(verseText, wordsFixed, failedWords);
    console.log('Visual result:', display);
    console.log('');
    
    // STEP 1: User types "eternal"
    console.log('🎯 STEP 1: User types "eternal"');
    const result1 = simulateProcessWordSubmission("eternal", "eternal");
    console.log('Process result:', result1);
    
    // Add to wordsFixed (simulating SyntaxLabPage.tsx line 196)
    wordsFixed = [...wordsFixed, result1.currentWord || ''];
    console.log('Updated wordsFixed:', wordsFixed);
    
    // Check visual display
    display = simulateVisualDisplay(verseText, wordsFixed, failedWords);
    const eternalResult = display.find(d => d.cleanWord === 'eternal');
    console.log('Visual result for "eternal":', eternalResult);
    
    if (eternalResult && eternalResult.display === 'COMPLETED_GREEN') {
        console.log('✅ SUCCESS: "eternal" shows as completed');
    } else {
        console.log('❌ BUG: "eternal" does not show as completed');
        console.log('🔍 DEBUG: Checking data format mismatch...');
        
        // Debug the exact comparison
        const storedWord = result1.currentWord;
        const cleanStoredWord = storedWord.toLowerCase().replace(/[.,!?;:"']/g, '');
        const verseWord = "eternal";
        const cleanVerseWord = verseWord.toLowerCase().replace(/[.,!?;:"']/g, '');
        
        console.log(`  - Stored word: "${storedWord}"`);
        console.log(`  - Clean stored word: "${cleanStoredWord}"`);
        console.log(`  - Verse word: "${verseWord}"`);
        console.log(`  - Clean verse word: "${cleanVerseWord}"`);
        console.log(`  - Match: ${cleanStoredWord === cleanVerseWord}`);
    }
    
    console.log('');
    
    // STEP 2: User types "life"
    console.log('🎯 STEP 2: User types "life"');
    const result2 = simulateProcessWordSubmission("life", "life");
    console.log('Process result:', result2);
    
    wordsFixed = [...wordsFixed, result2.currentWord || ''];
    console.log('Updated wordsFixed:', wordsFixed);
    
    display = simulateVisualDisplay(verseText, wordsFixed, failedWords);
    const lifeResult = display.find(d => d.cleanWord === 'life');
    console.log('Visual result for "life":', lifeResult);
    
    if (lifeResult && lifeResult.display === 'COMPLETED_GREEN') {
        console.log('✅ SUCCESS: "life" shows as completed');
    } else {
        console.log('❌ BUG: "life" does not show as completed');
    }
    
    console.log('\n📋 FINAL ANALYSIS:');
    const bothWorking = eternalResult?.display === 'COMPLETED_GREEN' && lifeResult?.display === 'COMPLETED_GREEN';
    
    if (bothWorking) {
        console.log('✅ NO DATA FORMAT MISMATCH - Issue must be elsewhere');
        return false;
    } else {
        console.log('🚨 DATA FORMAT MISMATCH CONFIRMED');
        console.log('💡 Root cause: Mismatch between stored and compared word formats');
        return true;
    }
}

// Run the test
console.log('='.repeat(70));
const hasMismatch = testDataFormatMismatch();
console.log('='.repeat(70));

if (hasMismatch) {
    console.log('🎯 CONFIRMED ROOT CAUSE: Data format mismatch');
    console.log('🔧 SOLUTION NEEDED: Fix word storage or comparison logic');
} else {
    console.log('🎯 NOT A DATA FORMAT ISSUE');
    console.log('🔧 NEXT: Investigate React component re-rendering or other issues');
}
