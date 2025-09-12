/**
 * THAI LANGUAGE DEBUG TEST
 * Debug why Thai "เพราะ" is not matching correctly
 */

const debugThai = () => {
  console.log('🇹🇭 THAI LANGUAGE DEBUG TEST');
  console.log('============================');
  
  const thaiVerse = 'เพราะพระเจ้าทรงรักโลกมากจนทรงประทานพระบุตรองค์เดียวของพระองค์';
  const englishVerse = 'For God so loved the world that he gave his one and only Son';
  
  console.log('English verse:', englishVerse);
  console.log('Thai verse:', thaiVerse);
  
  const englishWords = englishVerse.split(' ');
  const thaiWords = thaiVerse.split(' ');
  
  console.log('\nWord comparison:');
  console.log('English words:', englishWords);
  console.log('Thai words:', thaiWords);
  console.log('English word count:', englishWords.length);
  console.log('Thai word count:', thaiWords.length);
  
  // Test position mapping
  console.log('\n🔍 Position mapping test for "For" (position 0):');
  
  // Method 1: Exact position
  console.log('Method 1 (exact position):', thaiWords[0] || 'undefined');
  
  // Method 2: Find by relative position
  const englishWordIndex = englishWords.findIndex(word => 
    word.toLowerCase().replace(/[.,!?;:"']/g, '') === 'for'
  );
  console.log('Method 2 (find by relative):', englishWordIndex, '→', thaiWords[englishWordIndex] || 'undefined');
  
  // Method 3: Proportional mapping
  const proportionalIndex = Math.floor((0 / englishWords.length) * thaiWords.length);
  console.log('Method 3 (proportional):', proportionalIndex, '→', thaiWords[proportionalIndex] || 'undefined');
  
  // Method 4: Semantic mapping (for = 0)
  const semanticPosition = Math.floor((0 / 12) * thaiWords.length);
  console.log('Method 4 (semantic):', semanticPosition, '→', thaiWords[semanticPosition] || 'undefined');
  
  // Method 5: Fallback first word
  console.log('Method 5 (fallback first):', thaiWords[0] || 'undefined');
  
  // Test user input matching
  const userInput = 'เพราะ';
  const expectedWord = thaiWords[0]; // Should be "เพราะ"
  
  console.log('\n🧪 User input test:');
  console.log('User typed:', `"${userInput}"`);
  console.log('Expected (first Thai word):', `"${expectedWord}"`);
  console.log('Match:', userInput === expectedWord);
  console.log('Clean match:', userInput.toLowerCase().trim().replace(/[.,!?;:"']/g, '') === expectedWord.toLowerCase().replace(/[.,!?;:"']/g, ''));
};

debugThai();
