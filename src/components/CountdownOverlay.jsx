import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CountdownOverlay = ({ isActive, onComplete, onCancel }) => {
  const [count, setCount] = useState(5);

  useEffect(() => {
    let intervalId = null;

    if (isActive) {
      setCount(5); // Reset count when activated
      
      // Initial vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }

      intervalId = setInterval(() => {
        setCount((prev) => {
          const nextCount = prev - 1;
          
          if (nextCount > 0) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(100);
            }
          }
          
          if (nextCount === 0) {
            clearInterval(intervalId);
            onComplete();
          }
          
          return nextCount;
        });
      }, 1000);
    } else {
      setCount(5); // Reset if deactivated
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  // Calculate SVG stroke dashoffset based on count
  // Circumference of circle with r=90 is 2 * Math.PI * 90 ≈ 565.48
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (count / 5) * circumference;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-red-950 to-gray-900 animate-in fade-in duration-300">
      
      {/* Top spacer */}
      <div className="pt-20"></div>

      {/* Center content */}
      <div className="flex flex-col items-center">
        {/* Countdown Circle */}
        <div className="relative w-[200px] h-[200px] flex items-center justify-center">
          {/* Glowing background */}
          <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl animate-pulse"></div>
          
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
            {/* Background circle track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            {/* Animated progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#ef4444" 
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <span className="relative z-10 text-8xl font-black text-white">
            {count}
          </span>
        </div>

        <div className="mt-10 flex flex-col items-center text-center px-6">
          <h2 className="text-xl font-bold text-red-400 animate-pulse mb-2">
            SOS ACTIVATING...
          </h2>
          <p className="text-sm text-gray-400">
            Shake detected — cancel if accidental
          </p>
        </div>
      </div>

      {/* Bottom spacer and button */}
      <div className="w-full px-6 pb-16 flex justify-center">
        <button
          onClick={onCancel}
          className="w-full max-w-sm py-4 rounded-full bg-white/10 border-2 border-white/30 text-white font-bold text-lg hover:bg-white/20 transition flex items-center justify-center gap-2"
        >
          <X className="w-6 h-6" />
          Cancel — I'm OK
        </button>
      </div>
    </div>
  );
};

export default CountdownOverlay;
