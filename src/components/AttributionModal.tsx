import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({ isOpen, onClose }) => {
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-white/40 transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="mb-6 text-2xl font-light tracking-wide text-white">
              About Harmonic Mode
            </h2>

            <div className="space-y-4 text-sm leading-relaxed text-gray-300">
              <p>
                Based on the research of <strong className="text-white">Dr. Milton Mermikides</strong>, this mode maps the <em className="text-pink-300/90 italic">Circle of Fifths</em> to the color wheel.
              </p>
              <p>
                Unlike the "Newtonian" mode which maps raw frequency, this creates <strong className="text-white">visual harmony</strong> from <strong className="text-white">musical harmony</strong>.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href="https://www.youtube.com/watch?v=M9xN9M0fS0o"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-5 py-3 text-xs font-medium tracking-widest text-white transition-all hover:bg-white/10 hover:shadow-lg"
              >
                <span>WATCH THE ORIGINAL LECTURE</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <a
                href="https://www.miltonline.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-5 py-3 text-xs font-medium tracking-widest text-white transition-all hover:bg-white/10 hover:shadow-lg"
              >
                <span>VISIT MILTON MERMIKIDES' WEBSITE</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
