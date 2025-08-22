export function calculateAccuracy(userInput: string, originalVerse: string): number {
  const normalizeText = (text: string) => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

  const userWords = normalizeText(userInput).split(' ');
  const originalWords = normalizeText(originalVerse).split(' ');
  
  let matches = 0;
  const maxLength = Math.max(userWords.length, originalWords.length);
  
  // Calculate word-by-word accuracy
  for (let i = 0; i < Math.min(userWords.length, originalWords.length); i++) {
    if (userWords[i] === originalWords[i]) {
      matches++;
    }
  }
  
  // Penalize for length differences
  const lengthPenalty = Math.abs(userWords.length - originalWords.length) / maxLength;
  const accuracy = (matches / maxLength) * (1 - lengthPenalty * 0.5);
  
  return Math.max(0, Math.min(100, Math.round(accuracy * 100)));
}

export function generateFeedback(accuracy: number, userInput: string, originalVerse: string): {
  feedback: string;
  suggestions: string[];
} {
  const feedback = accuracy >= 90 
    ? "Excellent work! You nailed it!" 
    : accuracy >= 70 
    ? "Good job! You're getting there!" 
    : accuracy >= 50
    ? "Good effort! Keep practicing!"
    : "Don't give up! Practice makes perfect!";

  const suggestions: string[] = [];
  
  if (accuracy < 90) {
    suggestions.push("Try reading the verse aloud several times before memorizing");
    suggestions.push("Focus on understanding the meaning of each phrase");
  }
  
  if (accuracy < 70) {
    suggestions.push("Break the verse into smaller chunks and memorize piece by piece");
    suggestions.push("Practice writing the verse by hand to improve retention");
  }
  
  if (accuracy < 50) {
    suggestions.push("Start with shorter verses to build confidence");
    suggestions.push("Use memory techniques like visualization or rhythm");
  }

  return { feedback, suggestions };
}