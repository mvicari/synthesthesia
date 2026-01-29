import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'synth' | 'mic';
}

export const ContextModal: React.FC<ContextModalProps> = ({ isOpen, onClose, mode }) => {
  const isPhysics = mode === 'synth';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Header */}
            <div className="mb-8">
              <span className="mb-2 inline-block text-[10px] font-bold tracking-[0.3em] text-pink-500 uppercase">
                Theory & Context
              </span>
              <h2 className="text-3xl font-thin tracking-wide text-white">
                {isPhysics ? 'The Physics Model' : 'The Harmonic Model'}
                <span className="ml-3 text-lg opacity-40 italic">
                  ({isPhysics ? 'Newtonian' : 'Mermikides'})
                </span>
              </h2>
            </div>

            {/* Body */}
            <div className="space-y-8">
              {/* History Section */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">History</h3>
                <p className="text-sm leading-relaxed text-gray-300 font-light">
                  {isPhysics ? (
                    <>
                      In his 1704 work <em className="text-white italic">Opticks</em>, Sir Isaac Newton proposed a direct link between the spectrum of light and the musical scale. He even arbitrarily added "Orange" and "Indigo" to the rainbow to force it to have 7 distinct colors, matching the 7 notes of the Western major scale.
                    </>
                  ) : (
                    <>
                      Based on the modern research of <strong className="text-white font-medium">Dr. Milton Mermikides</strong>, this model argues that we hear music in circles, not straight lines. It prioritizes perceptual harmony over physical frequency.
                    </>
                  )}
                </p>
              </div>

              {/* Technical Section */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">How it Works</h3>
                <p className="text-sm leading-relaxed text-gray-300 font-light">
                  {isPhysics ? (
                    <>
                      This mode follows that linear logic. It takes the audio frequency and doubles it ~40 times (raising it 40 octaves) until the sound wave becomes a light wave. While mathematically accurate, it ignores musical perception—separating the "Low C" (Red) from the "High C" (Violet).
                    </>
                  ) : (
                    <>
                      This mode maps the <strong className="text-white font-medium">Circle of Fifths</strong> to the Color Wheel. This ensures that harmonically compatible notes (like C and G) result in analogous colors (Red and Orange), creating a visual experience that feels as consonant as the audio.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Links / Footer */}
            <div className="mt-10 flex flex-wrap gap-4 border-t border-white/5 pt-8">
              {isPhysics ? (
                <>
                  <a
                    href="https://www.gutenberg.org/files/33504/33504-h/33504-h.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    READ NEWTON'S OPTICKS
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </a>
                  <a
                    href="https://en.wikipedia.org/wiki/Visible_spectrum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    THE VISIBLE SPECTRUM
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="https://www.youtube.com/live/U_qfzhXjziI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    WATCH THE LECTURE
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </a>
                  <a
                    href="https://www.miltonline.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    DR. MILTON MERMIKIDES
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
