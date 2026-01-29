import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { frequencyToHSL, getMixColor, getHarmonicColor } from '../utils/colors';

export type VisualizerMode = 'synth' | 'mic';


export interface Ripple {
  id: string;
  frequency: number;
  x: number;
  y: number;
}

interface VisualizerProps {
  ripples: Ripple[];
  activeNotes: Set<number>;
  pitchBend?: number;
  mode?: VisualizerMode;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  ripples,
  activeNotes,
  pitchBend = 0,
  mode = 'synth',
}) => {
  // Helper to calculate bent frequency
  const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);

  // 1. Determine Active Inputs
  const hasActiveInput = activeNotes.size > 0;

  // 2. Determine Primary Frequency and All Active Frequencies
  let primaryFrequency = 0;
  const allActiveFreqs: number[] = [];

  if (hasActiveInput) {
    const freqs = Array.from(activeNotes).map(getBentFreq);
    primaryFrequency = freqs[0]; // Just take first for primary color
    allActiveFreqs.push(...freqs);
  }

  // 3. Calculate Color based on Mode (Theory)
  let blendColor = 'transparent';
  if (primaryFrequency > 0) {
    if (mode === 'mic') {
      // Harmonic Mode (Circle of Fifths)
      blendColor = getHarmonicColor(primaryFrequency);
    } else {
      // Physics Mode (Octave Doubling)
      // Use getMixColor if multiple notes, or single frequency to HSL
      if (allActiveFreqs.length > 1) {
        blendColor = getMixColor(allActiveFreqs);
      } else {
        blendColor = frequencyToHSL(primaryFrequency);
      }
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-black z-0 perspective-[1000px]">
      {/* Deep Space / Aurora Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, ease: "linear", repeat: Infinity }}
          className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-30 mix-blend-screen"
          style={{
            background: `conic-gradient(from 0deg, ${blendColor} 0%, transparent 40%, ${blendColor} 80%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Dynamic Background Pulse (Chord Color) */}
      <div className="absolute inset-0 flex items-center justify-center transition-colors duration-200 ease-linear">
        {hasActiveInput && (
          <div
            className="w-full h-full opacity-15 blur-3xl mix-blend-screen transition-all duration-300"
            style={{
              backgroundColor: blendColor,
              transform: `scale(${1 + activeNotes.size * 0.05})`
            }}
          />
        )}
      </div>

      {/* Main 3D Scene Layer - Simplified ripples */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {ripples.map((ripple) => {
            // Calculate ripple color based on CURRENT mode
            // This ensures ripples match the current theory being visualized
            let color = 'white';
            const freq = getBentFreq(ripple.frequency);
            if (mode === 'mic') {
              color = getHarmonicColor(freq);
            } else {
              color = frequencyToHSL(freq);
            }

            return (
              <React.Fragment key={ripple.id}>
                {/* Core shockwave - clean single ring */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.6, borderWidth: '3px' }}
                  animate={{ scale: 4, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: [0.1, 0.67, 0.83, 0.67] }}
                  className="absolute rounded-full border box-content mix-blend-screen"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: '100px',
                    height: '100px',
                    x: '-50%',
                    y: '-50%',
                    borderColor: color,
                    boxShadow: `0 0 40px ${color}`,
                  }}
                />
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>



      {/* Sustained Active Note Orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {hasActiveInput && (
            <motion.div
              key="main-orb"
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{
                scale: [1, 1.2 + 0.1, 1.1],
                opacity: 0.5,
                filter: 'blur(60px)'
              }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{
                duration: 0.3,
                scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              }}
              className="absolute w-72 h-72 rounded-full mix-blend-screen"
              style={{
                backgroundColor: blendColor,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
