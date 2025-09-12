// Check if Thai verse actually starts with "เพราะ"
const thaiVerse = 'เพราะพระเจ้าทรงรักโลกมากจนทรงประทานพระบุตรองค์เดียวของพระองค์';
console.log('Thai verse:', thaiVerse);
console.log('Starts with "เพราะ":', thaiVerse.startsWith('เพราะ'));
console.log('First 5 characters:', thaiVerse.substring(0, 5));
console.log('Match "เพราะ":', thaiVerse.substring(0, 5) === 'เพราะ');
