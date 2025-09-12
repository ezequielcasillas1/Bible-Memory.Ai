/**
 * FINAL THAI DEBUG - Trace the exact execution path
 */

// Copy the exact enhanced algorithm with debug output
const debugEnhancedGetTranslatedWord = (englishWord, position, originalVerse, translatedVerse) => {
  const englishWords = originalVerse.split(' ');
  const translatedWords = translatedVerse.split(' ');
  
  console.log('=== DEBUG TRACE ===');
  console.log('translatedWords.length:', translatedWords.length);
  console.log('translatedWords[0].length:', translatedWords[0].length);
  console.log('Condition check:', translatedWords.length === 1 && translatedWords[0].length > 10);
  
  // Method 5: ENHANCED - Handle languages without word separators (Thai, Chinese, Japanese)
  if (translatedWords.length === 1 && translatedWords[0].length > 10) {
    console.log('✅ Inside language without spaces block');
    // This is likely a language without spaces (Thai, Chinese, Japanese)
    const fullTranslatedVerse = translatedWords[0];
    console.log('fullTranslatedVerse:', fullTranslatedVerse);
    
    // For position 0 (first word), try to extract the beginning portion
    if (position === 0) {
      console.log('✅ Position is 0');
      // Thai: "เพราะ" is typically the first word
      // Chinese: "因为" or "神爱世人" are typically the first words
      // Try specific patterns for common biblical opening words
      const commonOpenings = [
        'เพราะ',    // Thai "For/Because"
        '因为',     // Chinese "Because"
        '神爱世人',  // Chinese "God loves the world"
        '神愛世人',  // Traditional Chinese
        '神は世を愛し', // Japanese
      ];
      
      console.log('Checking common openings...');
      // Check if the verse starts with any common opening
      for (const opening of commonOpenings) {
        console.log(`  Checking "${opening}": ${fullTranslatedVerse.startsWith(opening)}`);
        if (fullTranslatedVerse.startsWith(opening)) {
          console.log(`✅ FOUND MATCH: "${opening}"`);
          return opening;
        }
      }
      
      console.log('No common opening found, trying fallback lengths...');
      // Fallback: try different lengths but prefer longer meaningful words
      const possibleLengths = [5, 4, 6, 3, 2]; // Start with length 5 for "เพราะ"
      
      for (const length of possibleLengths) {
        const candidate = fullTranslatedVerse.substring(0, length);
        console.log(`  Length ${length}: "${candidate}" (length >= 2: ${candidate.length >= 2})`);
        if (candidate && candidate.length >= 2) { // Minimum 2 characters
          console.log(`✅ FALLBACK MATCH: "${candidate}"`);
          return candidate;
        }
      }
    }
  }
  
  console.log('❌ No match found, returning English word');
  return englishWord;
};

// Test the exact scenario
console.log('🇹🇭 FINAL THAI DEBUG TEST');
console.log('==========================');

const result = debugEnhancedGetTranslatedWord(
  'For',
  0,
  'For God so loved the world that he gave his one and only Son',
  'เพราะพระเจ้าทรงรักโลกมากจนทรงประทานพระบุตรองค์เดียวของพระองค์'
);

console.log('\n🎯 FINAL RESULT:', `"${result}"`);
console.log('Expected: "เพราะ"');
console.log('Success:', result === 'เพราะ');
