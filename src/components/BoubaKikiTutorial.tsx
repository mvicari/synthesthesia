import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bouba-Kiki Tutorial Mode
 * 
 * Explores the cross-modal correspondence between shape and sound.
 * Based on experiments originating over a century ago demonstrating that 
 * humans consistently associate rounded shapes with smooth sounds (Bouba) 
 * and jagged shapes with sharp sounds (Kiki).
 * 
 * "When subjects are shown a rounded shape and a jagged one, people 
 *  overwhelmingly label the rounded form 'bouba' or 'maluma', and the 
 *  jagged one 'kiki' or 'takete'."
 *  — Milton Mermikides, Music of Light & Colour (2026)
 * 
 * Dr. Mermikides verified this by creating circular waveforms matching 
 * these shapes and playing them through a synthesiser - the rounded shape 
 * produces a smooth, gentle sound; the jagged one a bright, abrasive texture.
 * 
 * @see Köhler, W. (1929). Gestalt Psychology
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 */

interface BoubaKikiTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoubaKikiTutorial: React.FC<BoubaKikiTutorialProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const [activeShape, setActiveShape] = useState<'bouba' | 'kiki' | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-gray-900/95 p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Header */}
            <div className="mb-8 text-center">
              <span className="mb-2 inline-block text-[10px] font-bold tracking-[0.3em] text-purple-400 uppercase">
                Cross-Modal Correspondence
              </span>
              <h2 className="text-4xl font-thin tracking-wide text-white mb-2">
                Bouba–Kiki Effect
              </h2>
              <p className="text-sm text-white/50 font-light max-w-lg mx-auto">
                "Seeing becomes hearing. Our brains are sensitive to shared structural features across senses."
              </p>
            </div>

            {/* Shape Comparison */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Bouba */}
              <motion.div
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  activeShape === 'bouba' 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onClick={() => setActiveShape('bouba')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-square flex items-center justify-center mb-4">
                  {/* Rounded Bouba shape */}
                  <svg viewBox="0 0 200 200" className="w-32 h-32">
                    <motion.path
                      d="M100,20 C150,20 180,60 180,100 C180,140 150,180 100,180 C50,180 20,140 20,100 C20,60 50,20 100,20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-purple-300"
                      animate={activeShape === 'bouba' ? {
                        d: [
                          "M100,20 C150,20 180,60 180,100 C180,140 150,180 100,180 C50,180 20,140 20,100 C20,60 50,20 100,20",
                          "M100,25 C145,25 175,65 175,100 C175,135 145,175 100,175 C55,175 25,135 25,100 C25,65 55,25 100,25",
                          "M100,20 C150,20 180,60 180,100 C180,140 150,180 100,180 C50,180 20,140 20,100 C20,60 50,20 100,20"
                        ]
                      } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-light text-purple-200 mb-1">Bouba</h3>
                  <p className="text-xs text-white/40 font-mono mb-2">SINE WAVEFORM</p>
                  <p className="text-sm text-white/60">
                    Rounded, smooth, gentle. Associated with rounded mouth shapes and soft audio transients.
                  </p>
                </div>
              </motion.div>

              {/* Kiki */}
              <motion.div
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  activeShape === 'kiki' 
                    ? 'bg-orange-500/20 border-orange-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                onClick={() => setActiveShape('kiki')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-square flex items-center justify-center mb-4">
                  {/* Jagged Kiki shape */}
                  <svg viewBox="0 0 200 200" className="w-32 h-32">
                    <motion.path
                      d="M100,10 L130,70 L190,80 L145,120 L170,180 L100,150 L30,180 L55,120 L10,80 L70,70 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-orange-300"
                      animate={activeShape === 'kiki' ? {
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 0.2, repeat: Infinity }}
                      style={{ transformOrigin: 'center' }}
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-light text-orange-200 mb-1">Kiki</h3>
                  <p className="text-xs text-white/40 font-mono mb-2">SAWTOOTH WAVEFORM</p>
                  <p className="text-sm text-white/60">
                    Jagged, sharp, abrasive. Associated with spiky mouth shapes and sharp audio transients.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest">
                  Circular Waveform Mapping
                </span>
                <span className="text-[10px] text-white/30">
                  After Mermikides (2026)
                </span>
              </div>
              
              <div className="relative h-32 flex items-center justify-center">
                {/* Bouba waveform */}
                <svg viewBox="0 0 200 100" className="absolute left-0 w-1/2 h-full opacity-60">
                  <motion.path
                    d="M0,50 Q25,30 50,50 T100,50 T150,50 T200,50"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2"
                    animate={activeShape === 'bouba' ? {
                      d: [
                        "M0,50 Q25,30 50,50 T100,50 T150,50 T200,50",
                        "M0,50 Q25,20 50,50 T100,50 T150,50 T200,50",
                        "M0,50 Q25,30 50,50 T100,50 T150,50 T200,50"
                      ]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </svg>
                
                {/* Kiki waveform */}
                <svg viewBox="0 0 200 100" className="absolute right-0 w-1/2 h-full opacity-60">
                  <motion.path
                    d="M0,50 L25,20 L50,80 L75,20 L100,80 L125,20 L150,80 L175,20 L200,50"
                    fill="none"
                    stroke="#fdba74"
                    strokeWidth="2"
                    animate={activeShape === 'kiki' ? {
                      strokeWidth: [2, 3, 2]
                    } : {}}
                    transition={{ duration: 0.1, repeat: Infinity }}
                  />
                </svg>
                
                {/* Center label */}
                <div className="bg-gray-900/80 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                  <span className="text-xs text-white/50 font-mono">
                    Press [V] to toggle in app
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/30 font-mono">
                "The tendency to map pitch onto vertical space... is innate in our culture; 
                it is unquestioned and automatic."
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
