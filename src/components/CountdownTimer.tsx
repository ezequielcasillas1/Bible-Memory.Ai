import React from 'react';

interface CountdownTimerProps {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeLeft, totalTime, isActive }) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'text-red-500';
    if (timeLeft <= 5) return 'text-yellow-500';
    return 'text-purple-600';
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-purple-200"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ${
              timeLeft <= 3 ? 'text-red-500' : 
              timeLeft <= 5 ? 'text-yellow-500' : 
              'text-purple-600'
            }`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold countdown-timer ${
          timeLeft <= 3 ? 'countdown-urgent' : getTimerColor()
        }`}>
          {timeLeft}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;