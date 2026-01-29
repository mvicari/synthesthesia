import React, { useRef, useEffect } from 'react';

interface WheelsProps {
  onPitchBend: (value: number) => void;
  pitchBend: number;
}

export const Wheels: React.FC<WheelsProps> = ({ 
  onPitchBend, 
  pitchBend, 
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);
  const isDraggingPitch = useRef(false);

  // Helper to calculate value from mouse Y position
  const calculateValue = (clientY: number, rect: DOMRect) => {
    // 0 at bottom, 1 at top
    const relativeY = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    
    // Map 0..1 to -2..2
    return (relativeY * 4) - 2;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPitch.current && pitchRef.current) {
        const val = calculateValue(e.clientY, pitchRef.current.getBoundingClientRect());
        onPitchBend(val);
      }
    };

    const handleMouseUp = () => {
      isDraggingPitch.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingPitch.current && pitchRef.current) {
        // Prevent scrolling while moving wheel
        if (e.cancelable) e.preventDefault(); 
        const val = calculateValue(e.touches[0].clientY, pitchRef.current.getBoundingClientRect());
        onPitchBend(val);
      }
    };

    const handleTouchEnd = () => {
      isDraggingPitch.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPitchBend]);

  return (
    <div className="flex gap-6 h-32 md:h-48 select-none bg-gray-900 p-3 md:p-4 rounded-xl shadow-2xl border border-gray-800 shrink-0">
      {/* PITCH BEND */}
      <div className="flex flex-col items-center gap-2">
        <div 
          ref={pitchRef}
          onMouseDown={() => isDraggingPitch.current = true}
          onTouchStart={(e) => { isDraggingPitch.current = true; e.stopPropagation(); }}
          className="relative w-10 md:w-12 h-full bg-gray-800 rounded-lg cursor-ns-resize overflow-hidden border border-gray-700 shadow-inner group touch-none"
        >
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600/50 -translate-y-1/2" />
          
          {/* Handle */}
          <div 
            className="absolute left-0 right-0 h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded border-y border-gray-500 shadow-lg transition-transform duration-75 ease-out"
            style={{ 
              // Convert -2..2 to 0..100% position. 0 = 50%, 2 = 0%, -2 = 100%
              // Formula: 50% - (val * 25%)
              top: `calc(${50 - (pitchBend * 25)}% - 16px)` // -16px is half handle height
            }}
          >
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-mono tracking-widest">PITCH</span>
      </div>
    </div>
  );
};