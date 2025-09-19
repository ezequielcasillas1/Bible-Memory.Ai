import React, { useState, useEffect } from 'react';

interface VisualMemorizeInputProps {
  targetVerse: string;
  userInput: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const VisualMemorizeInput: React.FC<VisualMemorizeInputProps> = ({
  targetVerse,
  userInput,
  onInputChange,
  placeholder = "Type the verse from memory...",
  autoFocus = false
}) => {
  const [isTyping, setIsTyping] = useState(false);

  // Split target verse into words for comparison
  const targetWords = targetVerse.toLowerCase().split(/\s+/).map(word => 
    word.replace(/[.,!?;:"']/g, '')
  );
  
  // Split user input into words for comparison
  const userWords = userInput.toLowerCase().split(/\s+/).map(word => 
    word.replace(/[.,!?;:"']/g, '')
  );

  // Handle typing animation
  useEffect(() => {
    if (userInput.trim().length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [userInput]);

  // Render word-by-word comparison
  const renderWords = () => {
    const maxLength = Math.max(targetWords.length, userWords.length);
    const words = [];

    for (let i = 0; i < maxLength; i++) {
      const targetWord = targetWords[i];
      const userWord = userWords[i];
      const isCurrentPosition = i === userWords.length - 1 && userInput.trim().length > 0;
      const isCompleted = userWord && targetWord && userWord === targetWord;
      const isIncorrect = userWord && targetWord && userWord !== targetWord;
      const isBlank = !userWord && targetWord;

      // Determine styling based on word state
      let wordClassName = "inline-block mx-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ";
      
      if (isCompleted) {
        // ✅ Green highlight for correct words (from FillInBlankPractice.tsx)
        wordClassName += "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 text-white shadow-lg";
      } else if (isIncorrect) {
        // ❌ Red highlight for incorrect words
        wordClassName += "bg-gradient-to-r from-red-400 via-rose-500 to-red-600 text-white shadow-lg";
      } else if (isCurrentPosition && isTyping) {
        // 🎯 Blue gradient for current typing (from FillInBlankPractice.tsx)
        wordClassName += "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white border-white/30 animate-pulse shadow-xl";
      } else if (isBlank) {
        // 📝 Fill-in-blank placeholder
        wordClassName += "bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white border-2 border-white/30 animate-pulse shadow-lg";
      } else {
        // Default styling
        wordClassName += "bg-gray-100 text-gray-700 border border-gray-200";
      }

      words.push(
        <span key={i} className={wordClassName}>
          {isBlank ? "_____" : (userWord || targetWord)}
          {isCurrentPosition && isTyping && <span className="animate-pulse">|</span>}
        </span>
      );
    }

    return words;
  };

  return (
    <div className="space-y-4">
      {/* Visual word-by-word display */}
      <div className="w-full p-4 border border-purple-200 rounded-xl bg-white min-h-[120px] flex flex-wrap items-start content-start gap-2">
        {targetVerse ? renderWords() : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </div>
      
      {/* Hidden textarea for input handling (maintains existing functionality) */}
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
