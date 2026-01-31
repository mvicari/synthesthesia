import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'physics' | 'harmonic';
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  mode
}) => {
  const isPhysics = mode === 'physics';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-[2rem] bg-gray-900/95 p-4 sm:p-8 shadow-2xl backdrop-blur-2xl border border-white/5"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 sm:right-6 sm:top-6 rounded-full bg-white/5 p-1.5 sm:p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="mb-4 sm:mb-8 pr-8">
              <span className="mb-1 sm:mb-2 inline-block text-[9px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-pink-500 uppercase">
                Theory & Context
              </span>
              <h2 className="text-xl sm:text-3xl font-thin tracking-wide text-white">
                {isPhysics ? 'The Physics Model' : 'The Harmonic Model'}
                <span className="block sm:inline sm:ml-3 text-sm sm:text-lg opacity-40 italic mt-1 sm:mt-0">
                  ({isPhysics ? 'Newtonian' : 'Mermikides'})
                </span>
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-8">
              <div>
                <h3 className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/50">History</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-light">
                  {isPhysics ? (
                    <>
                      In his 1704 work <em className="text-white italic">Opticks</em>, Sir Isaac Newton proposed a direct link between the spectrum of light and the musical scale. He forced the rainbow to have <strong className="text-white">7 colors</strong> to match the 7 notes of the <strong className="text-white">D Dorian</strong> scale.
                    </>
                  ) : (
                    <>
                      Based on the <strong className="text-white">2026 Gresham College Lecture</strong> by <strong className="text-white font-medium">Dr. Milton Mermikides</strong>, this model argues that we hear music in circles, not straight lines.
                    </>
                  )}
                </p>
              </div>

              {isPhysics && (
                <blockquote className="italic text-xs sm:text-sm text-gray-400 pl-3 sm:pl-4">
                  "This secret analogy between light and sound leads one to suspect that all things in nature have their hidden rapports..."
                  <footer className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-white/40 not-italic">
                    — Voltaire (1738)
                  </footer>
                </blockquote>
              )}

              <div>
                <h3 className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/50">Philosophical Mapping</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-light">
                  {isPhysics ? (
                    <>
                      Visible light spans one octave. When shifted down <strong className="text-white">41 octaves</strong>, it sits around middle C. Each note has a unique "hue" based on its Terahertz frequency.
                    </>
                  ) : (
                    <>
                      Based on <strong className="text-white">perceptual synesthesia</strong> research, this model prioritizes perceptual harmony over physical frequency.
                    </>
                  )}
                </p>
              </div>

              {isPhysics && (
                <div>
                  <h3 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/50">Newton's Color-Note Mapping</h3>
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[8px] sm:text-[10px]">
                    <div className="rounded bg-red-600/80 py-1.5 sm:py-2 text-white font-medium">D<br/><span className="opacity-60 hidden sm:inline">Red</span></div>
                    <div className="rounded bg-orange-500/80 py-1.5 sm:py-2 text-white font-medium">E<br/><span className="opacity-60 hidden sm:inline">Orange</span></div>
                    <div className="rounded bg-yellow-400/80 py-1.5 sm:py-2 text-black font-medium">F<br/><span className="opacity-60 hidden sm:inline">Yellow</span></div>
                    <div className="rounded bg-green-500/80 py-1.5 sm:py-2 text-white font-medium">G<br/><span className="opacity-60 hidden sm:inline">Green</span></div>
                    <div className="rounded bg-blue-600/80 py-1.5 sm:py-2 text-white font-medium">A<br/><span className="opacity-60 hidden sm:inline">Blue</span></div>
                    <div className="rounded bg-indigo-700/80 py-1.5 sm:py-2 text-white font-medium">B<br/><span className="opacity-60 hidden sm:inline">Indigo</span></div>
                    <div className="rounded bg-violet-600/80 py-1.5 sm:py-2 text-white font-medium">C<br/><span className="opacity-60 hidden sm:inline">Violet</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-10 flex flex-wrap gap-2 sm:gap-4 pt-4 sm:pt-8">
              {isPhysics ? (
                <a
                  href="https://www.gutenberg.org/files/33504/33504-h/33504-h.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/5 px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white transition-all hover:bg-white/10"
                >
                  NEWTON'S OPTICKS
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </a>
              ) : (
                <>
                  <a
                    href="https://www.gresham.ac.uk/sites/default/files/transcript/R_2026_01_12_1618_Mermikides_T_V3.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-pink-500/10 px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-pink-200 transition-all hover:bg-pink-500/20"
                  >
                    <span className="hidden sm:inline">DOWNLOAD </span>TRANSCRIPT
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  </a>
                  <a
                    href="https://www.gresham.ac.uk/watch-now/music-light-colour"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/5 px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    LECTURE
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
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
