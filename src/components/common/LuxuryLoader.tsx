import React, { useState, useEffect } from 'react';

interface LuxuryLoaderProps {
  onFinish?: () => void;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Increment progress smoothly to 100% over ~2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsOpening(true);
            setTimeout(() => {
              setIsDone(true);
              if (onFinish) onFinish();
            }, 900);
          }, 350);
          return 100;
        }
        // Smooth progressive increments
        const increment = prev < 70 ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 2;
        return Math.min(100, prev + increment);
      });
    }, 55);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden">
      {/* Left Curtain */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full bg-[#0e0e0e] transition-transform duration-1000 pointer-events-auto"
        style={{
          transform: isOpening ? 'translateX(-100%)' : 'translateX(0)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Right Curtain */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full bg-[#0e0e0e] transition-transform duration-1000 pointer-events-auto"
        style={{
          transform: isOpening ? 'translateX(100%)' : 'translateX(0)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Content Center */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 pointer-events-auto transition-opacity duration-400 ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Ambient glow */}
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[#ac834e]/10 blur-[80px] pointer-events-none" />

        {/* Title */}
        <div className="text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-sans mb-2">
            Tech <span className="text-[#ac834e]">HUB</span>
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#ac834e]">
            Global Executive Conclave & Intelligence
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 flex flex-col items-center gap-3 relative z-10">
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#ac834e] transition-all duration-75 ease-out shadow-[0_0_12px_#ac834e]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between w-full text-xs font-mono">
            <span className="text-white/40 tracking-widest text-[10px] uppercase">INITIALIZING SYSTEM</span>
            <span className="text-[#ac834e] font-bold">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxuryLoader;
