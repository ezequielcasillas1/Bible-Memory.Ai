/**
 * SYNTAX LAB FILL-IN-BLANK UNIT TEST
 * 
 * This test verifies the core fill-in-blank functionality:
 * 1. Blank word identification and progression
 * 2. Word submission and validation
 * 3. Round progression logic
 * 4. Completion detection
 */

import { FillInBlankAPI } from '../services/fillInBlankService';
import { SyntaxLabAPI } from '../services/syntaxLabAPI';

// Mock verse for testing
const MOCK_VERSE = {
  id: 'john-3-16-test',
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  reference: 'John 3:16',
  testament: 'NT'
};

// Mock comparison result with specific wrong words
const MOCK_COMPARISON_RESULT = {
  accuracy: 75,
  totalWords: 26,
  correctWords: 23,
  incorrectWords: 3,
  missingWords: 0,
  extraWords: 0,
  detailedFeedback: 'Test session',
  userComparison: [
    { originalWord: 'God', userWord: 'Lord', status: 'incorrect', position: 1 },
    { originalWord: 'world', userWord: 'earth', status: 'incorrect', position: 5 },
    { originalWord: 'eternal', userWord: 'everlasting', status: 'incorrect', position: 24 }
  ],
  originalComparison: []
};

describe('Syntax Lab Fill-in-Blank Logic', () => {
  let fillInBlankState;
  let fillInBlankResult;

  beforeEach(() => {
    console.log('\n🧪 SETTING UP TEST CASE');
    console.log('Mock verse:', MOCK_VERSE.text);
    console.log('Wrong words to practice:', MOCK_COMPARISON_RESULT.userComparison.map(w => w.originalWord));
    
    // Create fill-in-blank state
    fillInBlankState = FillInBlankAPI.createFillInBlankState(MOCK_VERSE.text, MOCK_COMPARISON_RESULT);
    fillInBlankResult = FillInBlankAPI.generateBlanks(fillInBlankState);
    
    console.log('Generated blanks:', fillInBlankResult.blanks.map(b => ({
      word: b.word,
      isBlank: b.isBlank,
      position: b.position
    })));
  });

  test('1. Should identify correct words for blanks', () => {
    console.log('\n✅ TEST 1: Blank Word Identification');
    
    const blankWords = fillInBlankResult.blanks.filter(b => b.isBlank);
    const expectedWords = ['God', 'world', 'eternal'];
    
    console.log('Expected blank words:', expectedWords);
    console.log('Actual blank words:', blankWords.map(b => b.word));
    
    expect(blankWords).toHaveLength(3);
    expect(blankWords.map(b => b.word)).toEqual(expect.arrayContaining(expectedWords));
  });

  test('2. Should get current blank word (leftmost active)', () => {
    console.log('\n✅ TEST 2: Current Blank Word Detection');
    
    const currentBlankWord = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    
    console.log('Current blank word:', currentBlankWord);
    console.log('Expected: God (first word in sentence)');
    
    expect(currentBlankWord).toBe('God');
  });

  test('3. Should process correct word submission and advance', () => {
    console.log('\n✅ TEST 3: Word Submission and Progression');
    
    // Submit correct answer for "God"
    const result1 = FillInBlankAPI.processWordSubmission(fillInBlankState, 'God');
    
    console.log('Submission result for "God":', result1);
    expect(result1.isCorrect).toBe(true);
    expect(result1.message).toContain('Correct');
    
    // Check that the next blank word is now "world"
    const nextBlankWord = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    
    console.log('Next blank word after "God":', nextBlankWord);
    console.log('Expected: world');
    
    expect(nextBlankWord).toBe('world');
  });

  test('4. Should handle incorrect submissions', () => {
    console.log('\n✅ TEST 4: Incorrect Word Submission');
    
    // Submit wrong answer for "God"
    const result = FillInBlankAPI.processWordSubmission(fillInBlankState, 'Lord');
    
    console.log('Submission result for "Lord" (wrong):', result);
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('Try again');
    
    // Current blank should still be "God"
    const currentBlank = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    console.log('Current blank after wrong answer:', currentBlank);
    expect(currentBlank).toBe('God');
  });

  test('5. Should complete all blanks in sequence', () => {
    console.log('\n✅ TEST 5: Complete Fill-in-Blank Sequence');
    
    const correctAnswers = ['God', 'world', 'eternal'];
    const submissionResults = [];
    
    correctAnswers.forEach((answer, index) => {
      console.log(`\nSubmitting answer ${index + 1}: "${answer}"`);
      
      const currentBlank = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
      console.log('Current blank word:', currentBlank);
      expect(currentBlank).toBe(answer);
      
      const result = FillInBlankAPI.processWordSubmission(fillInBlankState, answer);
      submissionResults.push(result);
      
      console.log('Submission result:', result);
      expect(result.isCorrect).toBe(true);
    });
    
    // Check if completed
    const isCompleted = FillInBlankAPI.isCompleted(fillInBlankState);
    console.log('\nIs fill-in-blank completed?', isCompleted);
    expect(isCompleted).toBe(true);
    
    // No more blank words should be available
    const finalBlankWord = FillInBlankAPI.getCurrentBlankWord(fillInBlankState);
    console.log('Final blank word (should be null):', finalBlankWord);
    expect(finalBlankWord).toBeNull();
  });

  test('6. Should handle case-insensitive submissions', () => {
    console.log('\n✅ TEST 6: Case-Insensitive Word Matching');
    
    // Test different cases for "God"
    const testCases = ['god', 'GOD', 'God', 'gOd'];
    
    testCases.forEach(testCase => {
      // Reset state for each test
      const freshState = FillInBlankAPI.createFillInBlankState(MOCK_VERSE.text, MOCK_COMPARISON_RESULT);
      const result = FillInBlankAPI.processWordSubmission(freshState, testCase);
      
      console.log(`Testing "${testCase}":`, result.isCorrect);
      expect(result.isCorrect).toBe(true);
    });
  });

  test('7. Should handle punctuation correctly', () => {
    console.log('\n✅ TEST 7: Punctuation Handling');
    
    // Create a verse with punctuation
    const punctuatedVerse = 'For God, so loved the world!';
    const punctuatedComparison = {
      ...MOCK_COMPARISON_RESULT,
      userComparison: [
        { originalWord: 'God,', userWord: 'Lord,', status: 'incorrect', position: 1 },
        { originalWord: 'world!', userWord: 'earth!', status: 'incorrect', position: 5 }
      ]
    };
    
    const punctuatedState = FillInBlankAPI.createFillInBlankState(punctuatedVerse, punctuatedComparison);
    
    // Should accept "God" for "God," (ignoring punctuation)
    const result1 = FillInBlankAPI.processWordSubmission(punctuatedState, 'God');
    console.log('Submitting "God" for "God,":',result1.isCorrect);
    expect(result1.isCorrect).toBe(true);
    
    // Should also accept "God," (with punctuation)
    const freshPunctuatedState = FillInBlankAPI.createFillInBlankState(punctuatedVerse, punctuatedComparison);
    const result2 = FillInBlankAPI.processWordSubmission(freshPunctuatedState, 'God,');
    console.log('Submitting "God," for "God,":',result2.isCorrect);
    expect(result2.isCorrect).toBe(true);
  });

  test('8. Should generate proper formatted text with blanks', () => {
    console.log('\n✅ TEST 8: Formatted Text Generation');
    
    const formattedText = FillInBlankAPI.generateFormattedText(fillInBlankResult.blanks);
    
    console.log('Original text:', MOCK_VERSE.text);
    console.log('Formatted text:', formattedText);
    
    // Should contain underscores for blank words
    expect(formattedText).toContain('____'); // For blank words
    expect(formattedText).toContain('so'); // For non-blank words
    expect(formattedText).toContain('loved'); // For non-blank words
    
    // Should not contain the actual blank words
    expect(formattedText).not.toContain('God');
    expect(formattedText).not.toContain('world');
    expect(formattedText).not.toContain('eternal');
  });
});

// Integration test with SyntaxLabAPI
describe('Syntax Lab Integration Tests', () => {
  test('9. Should integrate with SyntaxLabAPI correctly', () => {
    console.log('\n✅ TEST 9: SyntaxLab API Integration');
    
    // Create session using SyntaxLabAPI
    const sessionData = SyntaxLabAPI.createSession(MOCK_COMPARISON_RESULT);
    
    console.log('Session data:', {
      id: sessionData.id,
      verseText: sessionData.verseText,
      wrongWords: sessionData.wrongWords
    });
    
    expect(sessionData.id).toBeDefined();
    expect(sessionData.verseText).toBeDefined();
    expect(sessionData.wrongWords).toHaveLength(3);
    expect(sessionData.wrongWords).toEqual(expect.arrayContaining(['God', 'world', 'eternal']));
  });
});

// Performance test
describe('Syntax Lab Performance Tests', () => {
  test('10. Should handle large verses efficiently', () => {
    console.log('\n✅ TEST 10: Performance with Large Verse');
    
    // Create a large verse (simulate Psalm 119:1-8)
    const largeVerse = `
      Blessed are those whose ways are blameless, who walk according to the law of the LORD.
      Blessed are those who keep his statutes and seek him with all their heart—
      they do no wrong but follow his ways. You have laid down precepts that are to be fully obeyed.
      Oh, that my ways were steadfast in obeying your decrees! Then I would not be put to shame
      when I consider all your commands. I will praise you with an upright heart as I learn your righteous laws.
      I will obey your decrees; do not utterly forsake me.
    `.replace(/\s+/g, ' ').trim();
    
    const largeComparison = {
      ...MOCK_COMPARISON_RESULT,
      userComparison: Array.from({length: 10}, (_, i) => ({
        originalWord: `word${i}`,
        userWord: `wrong${i}`,
        status: 'incorrect',
        position: i
      }))
    };
    
    const startTime = Date.now();
    
    const state = FillInBlankAPI.createFillInBlankState(largeVerse, largeComparison);
    const result = FillInBlankAPI.generateBlanks(state);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('Large verse processing time:', processingTime + 'ms');
    console.log('Large verse word count:', largeVerse.split(' ').length);
    console.log('Generated blanks count:', result.blanks.length);
    
    expect(processingTime).toBeLessThan(100); // Should process quickly
    expect(result.blanks.length).toBeGreaterThan(0);
  });
});

console.log('\n🎯 FILL-IN-BLANK UNIT TEST SUITE COMPLETE');
console.log('This test suite verifies:');
console.log('✅ Blank word identification');
console.log('✅ Word progression logic');
console.log('✅ Correct/incorrect submission handling');
console.log('✅ Case-insensitive matching');
console.log('✅ Punctuation handling');
console.log('✅ Completion detection');
console.log('✅ Text formatting');
console.log('✅ API integration');
console.log('✅ Performance with large content');
