import React from 'react';
import { motion } from 'framer-motion';

/**
 * Slow Light Octave Journey Visualization
 * 
 * Visualizes the concept from Philip Houghton's "slowed down light" - 
 * the journey from visible light (THz) down 41 octaves to audible frequencies.
 * 
 * "The Australian composer and painter Phillip Houghton (1954–2017) told me 
 *  in conversation that he conceived of his (and all) music as 'slowed down light', 
 *  drawing inspiration from this 'secret analogy'."
 *  — Milton Mermikides, Music of Light & Colour (2026)
 * 
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 */

interface OctaveJourneyProps {
  frequency: number;
  isVisible: boolean;
}

export const OctaveJourney: React.FC<OctaveJourneyProps> = ({ frequency, isVisible }) => {
  if (!isVisible || frequency <= 0) return null;

  // Visible light and audible frequency boundaries
  const VISIBLE_LIGHT_MIN = 384e12; // 384 THz (red)
  
  // Calculate how many octaves we've shifted
  const calculateOctaveShift = (freq: number): number => {
    let targetFreq = freq;
    let octaves = 0;
    while (targetFreq < VISIBLE_LIGHT_MIN) {
      targetFreq *= 2;
      octaves++;
    }
    return octaves;
  };

  const octaveShift = calculateOctaveShift(frequency);
  const progress = Math.min(1, octaveShift / 41); // 41 octaves is full journey

  // Color gradient from violet (light) to red (deep sound)
  const getJourneyColor = (progress: number): string => {
    // Map progress 0->1 to hue 280->0 (violet to red)
    const hue = 280 - (progress * 280);
    return `hsl(${hue}, 80%, 60%)`;
  };

  const currentColor = getJourneyColor(progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
    >
      <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 font-mono">
          Slow Light
        </span>
        
        {/* Vertical Octave Journey Bar */}
        <div className="relative w-3 h-48 bg-white/5 rounded-full overflow-hidden">
          {/* Spectrum gradient background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(to top, hsl(0, 80%, 60%), hsl(60, 80%, 60%), hsl(120, 80%, 60%), hsl(240, 80%, 60%), hsl(280, 80%, 60%))'
            }}
          />
          
          {/* Progress indicator */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ 
              bottom: `${progress * 100}%`,
              backgroundColor: currentColor
            }}
            layoutId="octave-indicator"
          />
          
          {/* Light region marker */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-transparent">
            <span className="absolute -left-12 top-0 text-[7px] text-white/30 font-mono">THz</span>
          </div>
          
          {/* Sound region marker */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/20 to-transparent">
            <span className="absolute -left-12 bottom-0 text-[7px] text-white/30 font-mono">Hz</span>
          </div>
        </div>
        
        {/* Octave count */}
        <div className="text-center">
          <span className="text-2xl font-thin text-white" style={{ color: currentColor }}>
            {octaveShift}
          </span>
          <span className="text-[8px] text-white/40 font-mono block">octaves</span>
        </div>
        
        {/* Journey description */}
        <div className="text-center max-w-[80px]">
          <span className="text-[7px] text-white/30 font-mono leading-tight block">
            {progress < 0.3 ? 'Visible Light' : progress < 0.7 ? 'Infrared → Radio' : 'Audible Range'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
