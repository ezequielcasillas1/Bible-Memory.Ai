import React, { useState, useEffect } from 'react';

interface VisualMemorizeInputProps {
  targetVerse: string;
  userInput: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  comparisonResult?: any; // For showing wrong words
}

const VisualMemorizeInput: React.FC<VisualMemorizeInputProps> = ({
  targetVerse,
  userInput,
  onInputChange,
  placeholder = "Type the verse from memory...",
  autoFocus = false,
  comparisonResult
}) => {
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  
  // Get failed words from comparison result (like auto practice)
  const failedWords = comparisonResult?.wrongWords?.map((w: any) => 
    w.originalWord?.toLowerCase().replace(/[.,!?;:"']/g, '') || ''
  ) || [];
  
  // Split verse into words (exact same as auto practice)
  const words = targetVerse.split(/\s+/);
  
  // Track completed words (words typed correctly)
  const userWords = userInput.toLowerCase().split(/\s+/);
  const completedWords: string[] = [];
  
  // Compare user input word by word
  words.forEach((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
    const userWord = userWords[index]?.toLowerCase().replace(/[.,!?;:"']/g, '');
    if (userWord && cleanWord === userWord) {
      completedWords.push(cleanWord);
    }
  });

  // Create sets for efficient lookup (exact same as auto practice)
  const uniqueFailedWords = new Set(failedWords);
  const uniqueCompletedWords = new Set(completedWords);
  
  // Find current blank word (first uncompleted failed word)
  const currentBlankWord = failedWords.find(word => !uniqueCompletedWords.has(word));
  
  // EXACT SAME RENDERING LOGIC AS AUTO PRACTICE
  const renderWords = () => {
    const processedUniqueWords = new Set<string>();
    
    return words.map((word: string, index: number) => {
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
          // GREEN HIGHLIGHT: Completed words (EXACT SAME AS AUTO PRACTICE)
          return (
            <span 
              key={`completed-${cleanWord}-${index}`} 
              className="inline-block mx-1 px-3 py-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-white rounded-lg font-bold shadow-lg border-2 border-green-300 animate-pulse"
              style={{
                animation: 'greenSuccess 0.6s ease-out'
              }}
            >
              {word}
            </span>
          );
        } else if (isCurrentBlank) {
          // ENHANCED: Currently active blank with REAL-TIME LETTER-BY-LETTER TYPING (EXACT SAME)
          const displayText = userInput.trim() || '_____';
          const isTyping = userInput.trim().length > 0;
          
          return (
            <span 
              key={`current-${cleanWord}-${index}`} 
              className={`inline-block mx-2 px-6 py-3 rounded-2xl font-bold shadow-2xl border-2 transform scale-110 backdrop-blur-sm transition-all duration-300 ${
                isTyping 
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white border-white/30 animate-pulse'
                  : 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white border-white/30 animate-pulse'
              }`}
              style={{
                textDecoration: 'underline',
                textDecorationColor: '#fbbf24',
                textDecorationThickness: '3px',
                animation: isTyping ? 'none' : 'purpleActive 1.5s ease-in-out infinite alternate',
                boxShadow: isTyping 
                  ? '0 0 40px rgba(59, 130, 246, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                  : '0 0 30px rgba(139, 92, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <span className="text-xl font-mono tracking-widest">
                {displayText}
                {isTyping && <span className="animate-pulse">|</span>}
              </span>
            </span>
          );
        } else {
          // ENHANCED: Waiting blanks - Professional gradient styling (EXACT SAME)
          return (
            <span 
              key={`waiting-${cleanWord}-${index}`} 
              className="inline-block mx-2 px-4 py-2 bg-gradient-to-br from-amber-200 via-yellow-200 to-orange-200 text-amber-800 rounded-xl font-bold border-2 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                textDecoration: 'underline',
                textDecorationColor: '#f59e0b',
                textDecorationThickness: '2px',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
              }}
            >
              <span className="text-lg font-mono tracking-wide">_____</span>
            </span>
          );
        }
      }
      
      // Regular words (EXACT SAME)
      return (
        <span key={index} className="mx-1 text-gray-700 transition-all duration-300 hover:text-emerald-600">
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* EXACT SAME VISUAL DISPLAY AS AUTO PRACTICE */}
      <div className="w-full p-6 border-2 border-purple-200 rounded-xl bg-gradient-to-br from-white via-purple-50 to-indigo-50 min-h-[150px] flex flex-wrap items-start content-start gap-1 shadow-lg">
        {targetVerse ? renderWords() : (
          <span className="text-gray-400 italic text-lg">{placeholder}</span>
        )}
      </div>
      
      {/* Input field for typing */}
      <textarea
        value={userInput}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 sm:p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-lg"
        rows={3}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default VisualMemorizeInput;
