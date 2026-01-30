import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Plato's Cave Accessibility Mode
 * 
 * A high-contrast, brightness-only visualization inspired by Plato's Allegory of the Cave:
 * "Behold! human beings living in an underground den... and they see only their own shadows, 
 *  or the shadows of one another, which the fire throws on the opposite wall of the cave."
 *  — Plato, Republic 514a–520a, Book VII
 * 
 * This mode removes color entirely, using only brightness variations (like shadows) to 
 * represent the audio-visual experience. It serves both:
 * 1. Accessibility for colorblind users or those with visual processing differences
 * 2. A poetic interpretation of the Platonic metaphor - we mistake shadows for reality
 * 
 * "Our senses are windows, not the landscape." — Milton Mermikides (2026)
 * 
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 */

interface PlatosCaveModeProps {
  isActive: boolean;
  activeNotes: Set<number>;
  onToggle: () => void;
}

export const PlatosCaveMode: React.FC<PlatosCaveModeProps> = ({
  isActive,
  activeNotes,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press 'P' for Plato's Cave
      if (e.key.toLowerCase() === 'p' && !e.repeat) {
        setIsEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only show when explicitly enabled
  if (!isActive || !isEnabled) {
    return (
      <motion.button
        onClick={() => setIsEnabled(true)}
        className="absolute left-4 bottom-32 z-40 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        title="Plato's Cave Mode (Press P)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </motion.button>
    );
  }

  const hasActiveInput = activeNotes.size > 0;
  
  // Calculate brightness based on pitch (higher = brighter)
  const avgFreq = hasActiveInput 
    ? Array.from(activeNotes).reduce((a, b) => a + b, 0) / activeNotes.size 
    : 0;
  const normalizedPitch = Math.min(1, Math.max(0, (avgFreq - 200) / 800));
  const brightness = 0.1 + (normalizedPitch * 0.4);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] pointer-events-none bg-black"
      >
        {/* Cave wall texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Fire glow effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 100%, rgba(255,200,150,${brightness * 0.3}) 0%, transparent 70%)`
          }}
        />

        {/* Shadow puppets - represent active notes as shadows */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {hasActiveInput && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: brightness,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Multiple shadow layers for depth */}
                <div 
                  className="absolute inset-0 blur-3xl"
                  style={{
                    width: '400px',
                    height: '400px',
                    background: `radial-gradient(circle, rgba(0,0,0,${brightness}) 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                <div 
                  className="absolute inset-0 blur-2xl"
                  style={{
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, rgba(50,50,50,${brightness * 0.7}) 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                <div 
                  className="absolute inset-0 blur-xl"
                  style={{
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, rgba(100,100,100,${brightness * 0.5}) 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                
                {/* Central shadow form */}
                <motion.div
                  className="w-48 h-48 rounded-full bg-gradient-to-b from-white/20 to-transparent"
                  style={{
                    boxShadow: `0 0 50px rgba(255,255,255,${brightness * 0.3})`
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fire light flicker */}
        <motion.div
          animate={{
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(255,150,50,0.2) 0%, transparent 100%)'
          }}
        />

        {/* Cave frame/chains metaphor */}
        <div className="absolute inset-8 border-2 border-white/5 rounded-3xl pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-mono">
              Plato's Cave
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] text-white/30 font-mono mb-2">
            "We mistake shadows for the thing itself"
          </p>
          <button
            onClick={() => setIsEnabled(false)}
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-all"
          >
            Exit Cave (Press P)
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
