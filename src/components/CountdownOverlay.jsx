import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert } from 'lucide-react';

const CountdownOverlay = ({ isActive, onComplete, onCancel }) => {
  const [count, setCount] = useState(5);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (!isActive) {
      setCount(5);
      return;
    }

    setCount(5);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(150);
    }

    let remaining = 5;
    const intervalId = setInterval(() => {
      remaining -= 1;
      setCount(remaining);

      if (remaining > 0) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(80);
        }
      } else {
        clearInterval(intervalId);
        if (typeof onCompleteRef.current === 'function') {
          onCompleteRef.current();
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive]);

  if (!isActive) return null;

  // Circumference of circle with r=90 is 2 * Math.PI * 90 ≈ 565.48
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (count / 5) * circumference;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-gradient-to-b from-gray-950 via-red-950 to-gray-950 p-6 animate-in fade-in duration-200 select-none">
      
      {/* Top Header Tag */}
      <div className="pt-8 flex items-center gap-2 text-red-300 font-mono text-xs uppercase tracking-widest bg-red-950/80 border border-red-800/80 px-4 py-1.5 rounded-full shadow-lg">
        <img
          src="/images.jpeg"
          alt="Nightguardian"
          className="size-5 rounded-full object-cover border border-red-500/40 shrink-0"
        />
        <span>Emergency Trigger Verification</span>
      </div>

      {/* Center content: Countdown Circle */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative w-[210px] h-[210px] flex items-center justify-center">
          {/* Glowing pulse background */}
          <div className="absolute inset-0 rounded-full bg-red-600/30 blur-2xl animate-pulse" />
          
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 210 210">
            {/* Background circle track */}
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="6"
            />
            {/* Animated progress circle */}
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="#ef4444" 
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <span className="relative z-10 text-8xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
            {count}
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center text-center px-4 max-w-sm">
          <h2 className="text-2xl font-black text-white tracking-wide mb-2 flex items-center gap-2">
            BROADCASTING DISTRESS
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            A 5-second countdown gives you time to cancel before broadcasting distress to emergency contacts and live radar.
          </p>
        </div>
      </div>

      {/* Bottom Action: Big Tap-to-Cancel Button */}
      <div className="w-full max-w-sm pb-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-4 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/30 border-2 border-white/40 text-white font-bold text-lg transition-transform active:scale-95 flex items-center justify-center gap-2.5 shadow-2xl backdrop-blur-md cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
          Cancel — I'm OK
        </button>
        <span className="text-[11px] font-mono text-slate-400">
          Tap anytime within 5 seconds to abort
        </span>
      </div>
    </div>
  );
};

export default CountdownOverlay;
