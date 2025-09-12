/**
 * THAI SPECIFIC DEBUG TEST
 * Test exactly what the enhanced algorithm returns for Thai
 */

// Copy the exact enhanced algorithm
const enhancedGetTranslatedWord = (englishWord, position, originalVerse, translatedVerse) => {
  const englishWords = originalVerse.split(' ');
  const translatedWords = translatedVerse.split(' ');
  
  console.log('🔍 Debug info:');
  console.log('English words:', englishWords);
  console.log('Translated words:', translatedWords);
  console.log('Position:', position);
  console.log('English word:', englishWord);
  
  // Method 5: ENHANCED - Handle languages without word separators (Thai, Chinese, Japanese)
  if (translatedWords.length === 1 && translatedWords[0].length > 10) {
    console.log('✅ Detected language without spaces');
    // This is likely a language without spaces (Thai, Chinese, Japanese)
    const fullTranslatedVerse = translatedWords[0];
    console.log('Full verse:', fullTranslatedVerse);
    
    // For position 0 (first word), try to extract the beginning portion
    if (position === 0) {
      console.log('✅ Position is 0, extracting beginning portion');
      // Thai: "เพราะ" is typically the first 5 characters of "เพราะพระเจ้า..."
      // Chinese: "因为" or "神爱世人" are typically the first few characters
      // Try different lengths to find a reasonable first word
      const possibleLengths = [2, 3, 4, 5, 6];
      
      for (const length of possibleLengths) {
        const candidate = fullTranslatedVerse.substring(0, length);
        console.log(`  Length ${length}: "${candidate}"`);
        if (candidate) {
          console.log(`✅ Returning candidate: "${candidate}"`);
          return candidate;
        }
      }
    }
  }
  
  // Fallback
  console.log('❌ Using fallback logic');
  return englishWord;
};

// Test Thai specifically
console.log('🇹🇭 THAI SPECIFIC ALGORITHM TEST');
console.log('=================================');

const result = enhancedGetTranslatedWord(
  'For',
  0,
  'For God so loved the world that he gave his one and only Son',
  'เพราะพระเจ้าทรงรักโลกมากจนทรงประทานพระบุตรองค์เดียวของพระองค์'
);

console.log('\n🎯 FINAL RESULT:', `"${result}"`);
console.log('Expected user input: "เพราะ"');
console.log('Match:', result === 'เพราะ');

// Test different lengths manually
console.log('\n🧪 Manual length testing:');
const fullVerse = 'เพราะพระเจ้าทรงรักโลกมากจนทรงประทานพระบุตรองค์เดียวของพระองค์';
for (let i = 1; i <= 10; i++) {
  const candidate = fullVerse.substring(0, i);
  console.log(`Length ${i}: "${candidate}" ${candidate === 'เพราะ' ? '✅ MATCH!' : ''}`);
}
