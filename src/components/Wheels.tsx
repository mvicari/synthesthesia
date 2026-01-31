import React, { useRef, useEffect, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

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
  const lastTouchTime = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);

  // Spring-animated pitch value for smooth visual transitions
  const springPitch = useSpring(pitchBend, { stiffness: 300, damping: 30 });
  const handleTop = useTransform(springPitch, (val) => `calc(${50 - (val * 25)}% - 16px)`);

  // Helper to calculate value from mouse Y position
  const calculateValue = (clientY: number, rect: DOMRect) => {
    // 0 at bottom, 1 at top
    const relativeY = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    
    // Map 0..1 to -2..2
    return (relativeY * 4) - 2;
  };

  // Keep spring in sync with prop
  useEffect(() => {
    springPitch.set(pitchBend);
  }, [pitchBend, springPitch]);

  // Apply momentum after release
  const applyMomentum = useCallback(() => {
    if (Math.abs(velocity.current) < 0.01) return;

    const friction = 0.92;
    const animate = () => {
      velocity.current *= friction;
      const newVal = Math.max(-2, Math.min(2, pitchBend + velocity.current));

      if (Math.abs(velocity.current) > 0.005 && !isDraggingPitch.current) {
        onPitchBend(newVal);
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [pitchBend, onPitchBend]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPitch.current && pitchRef.current) {
        const val = calculateValue(e.clientY, pitchRef.current.getBoundingClientRect());
        velocity.current = (lastY.current - e.clientY) * 0.02; // Track velocity
        lastY.current = e.clientY;
        onPitchBend(val);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingPitch.current) {
        isDraggingPitch.current = false;
        applyMomentum();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingPitch.current && pitchRef.current) {
        // Prevent scrolling while moving wheel
        if (e.cancelable) e.preventDefault();
        const val = calculateValue(e.touches[0].clientY, pitchRef.current.getBoundingClientRect());
        velocity.current = (lastY.current - e.touches[0].clientY) * 0.02;
        lastY.current = e.touches[0].clientY;
        onPitchBend(val);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingPitch.current) {
        isDraggingPitch.current = false;
        applyMomentum();
      }
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
  }, [onPitchBend, pitchBend, applyMomentum]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchTime.current < 300) {
      onPitchBend(0);
      isDraggingPitch.current = false;
    } else {
      isDraggingPitch.current = true;
      lastY.current = e.touches[0].clientY;
      velocity.current = 0;
    }
    lastTouchTime.current = now;
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingPitch.current = true;
    lastY.current = e.clientY;
    velocity.current = 0;
  };

  return (
    <div className="flex gap-2 md:gap-6 h-32 md:h-48 select-none bg-gray-900 p-2 md:p-4 rounded-xl shadow-2xl border border-gray-800 shrink-0">
      {/* PITCH BEND */}
      <div className="flex flex-col items-center gap-1 md:gap-2">
        <div
          ref={pitchRef}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => onPitchBend(0)}
          onTouchStart={handleTouchStart}
          className="relative w-8 md:w-12 h-full bg-gray-800 rounded-lg cursor-ns-resize overflow-hidden border border-gray-700 shadow-inner group touch-none"
        >
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600/50 -translate-y-1/2" />
          
          {/* Handle - spring animated for smooth movement */}
          <motion.div
            className="absolute left-0 right-0 h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded border-y border-gray-500 shadow-lg"
            style={{
              // Convert -2..2 to 0..100% position. 0 = 50%, 2 = 0%, -2 = 100%
              top: handleTop
            }}
          >
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
            <div className="w-full h-px bg-gray-500 mt-1 opacity-50" />
          </motion.div>
        </div>
        <span className="text-[10px] text-gray-500 font-mono tracking-widest">PITCH</span>
      </div>
    </div>
  );
};