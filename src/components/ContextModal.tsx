import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'physics' | 'harmonic';
  analyser?: AnalyserNode | null;
  waveform?: OscillatorType;
  activeNotes?: Set<number>;
}

export const ContextModal: React.FC<ContextModalProps> = ({ 
  isOpen, 
  onClose, 
  mode,
  analyser,
  waveform = 'sine',
  activeNotes = new Set()
}) => {
  const isPhysics = mode === 'physics';
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [borderPath, setBorderPath] = useState('');
  const [borderColor, setBorderColor] = useState('rgba(255,255,255,0.1)');
  const isSaw = waveform === 'sawtooth' || waveform === 'square';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !analyser) return;

    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    let animationId: number;

    const update = () => {
      const dataArray = dataArrayRef.current;
      if (analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray as any);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        const width = 600;
        const height = 400;
        const padding = 20;
        const segments = 64;
        
        let path = '';
        
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;
          const dataIdx = Math.floor((i / segments) * dataArray.length);
          const v = (dataArray[dataIdx] - 128) / 128;
          
          if (isSaw) {
            const teeth = 8 + Math.floor(rms * 16);
            const phase = (i / segments) * teeth * Math.PI * 2;
            const toothVal = (phase % (Math.PI * 2)) / (Math.PI * 2);
            const y = padding + (toothVal > 0.5 ? -1 : 1) * (5 + rms * 15) + v * 5;
            path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          } else {
            const wave = Math.sin((i / segments) * Math.PI * 4) * (3 + rms * 12) + v * 8;
            const y = padding + wave;
            path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          }
        }
        
        for (let i = 0; i <= segments; i++) {
          const y = padding + (i / segments) * height;
          const dataIdx = Math.floor((i / segments) * dataArray.length);
          const v = (dataArray[dataIdx] - 128) / 128;
          
          if (isSaw) {
            const teeth = 6 + Math.floor(rms * 12);
            const phase = (i / segments) * teeth * Math.PI * 2;
            const toothVal = (phase % (Math.PI * 2)) / (Math.PI * 2);
            const x = width + padding + (toothVal > 0.5 ? 1 : -1) * (5 + rms * 15) + v * 5;
            path += ` L ${x} ${y}`;
          } else {
            const wave = Math.cos((i / segments) * Math.PI * 4) * (3 + rms * 12) + v * 8;
            const x = width + padding + wave;
            path += ` L ${x} ${y}`;
          }
        }
        
        for (let i = segments; i >= 0; i--) {
          const x = (i / segments) * width;
          const dataIdx = Math.floor((i / segments) * dataArray.length);
          const v = (dataArray[dataIdx] - 128) / 128;
          
          if (isSaw) {
            const teeth = 8 + Math.floor(rms * 16);
            const phase = (i / segments) * teeth * Math.PI * 2;
            const toothVal = (phase % (Math.PI * 2)) / (Math.PI * 2);
            const y = height + padding + (toothVal > 0.5 ? 1 : -1) * (5 + rms * 15) + v * 5;
            path += ` L ${x} ${y}`;
          } else {
            const wave = Math.sin((i / segments) * Math.PI * 4) * (3 + rms * 12) + v * 8;
            const y = height + padding + wave;
            path += ` L ${x} ${y}`;
          }
        }
        
        for (let i = segments; i >= 0; i--) {
          const y = padding + (i / segments) * height;
          const dataIdx = Math.floor((i / segments) * dataArray.length);
          const v = (dataArray[dataIdx] - 128) / 128;
          
          if (isSaw) {
            const teeth = 6 + Math.floor(rms * 12);
            const phase = (i / segments) * teeth * Math.PI * 2;
            const toothVal = (phase % (Math.PI * 2)) / (Math.PI * 2);
            const x = padding + (toothVal > 0.5 ? -1 : 1) * (5 + rms * 15) + v * 5;
            path += ` L ${x} ${y}`;
          } else {
            const wave = Math.cos((i / segments) * Math.PI * 4) * (3 + rms * 12) + v * 8;
            const x = padding + wave;
            path += ` L ${x} ${y}`;
          }
        }
        
        path += ' Z';
        setBorderPath(path);

        if (activeNotes.size > 0) {
          const hue = isPhysics ? 
            (Array.from(activeNotes)[0] / 2000) * 360 : 
            ((Array.from(activeNotes)[0] % 12) / 12) * 360;
          setBorderColor(`hsla(${hue}, 80%, 60%, ${0.3 + rms * 0.5})`);
        }
      }
      
      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, analyser, waveform, isSaw, activeNotes, isPhysics]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <div className="relative">
            {borderPath && (
              <svg 
                className="absolute -inset-4 pointer-events-none"
                style={{ width: 'calc(100% + 32px)', height: 'calc(100% + 32px)' }}
                viewBox="0 0 640 480"
                preserveAspectRatio="none"
              >
                <motion.path
                  d={borderPath}
                  fill="none"
                  stroke={borderColor}
                  strokeWidth={isSaw ? 3 : 2}
                  strokeLinecap={isSaw ? "butt" : "round"}
                  strokeLinejoin={isSaw ? "miter" : "round"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    filter: `drop-shadow(0 0 ${isSaw ? 15 : 10}px ${borderColor})`,
                  }}
                />
              </svg>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-gray-900/90 p-8 shadow-2xl backdrop-blur-2xl"
            >
              <button
                onClick={onClose}
                className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

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

              <div className="space-y-8">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">History</h3>
                  <p className="text-sm leading-relaxed text-gray-300 font-light">
                    {isPhysics ? (
                      <>
                        In his 1704 work <em className="text-white italic">Opticks</em>, Sir Isaac Newton proposed a direct link between the spectrum of light and the musical scale. He even explicitly forced the rainbow to have <strong className="text-white">7 colors</strong> (adding Orange and Indigo) to create a mathematical correspondence with the 7 notes of the <strong className="text-white">D Dorian</strong> musical scale.
                      </>
                    ) : (
                      <>
                        Based on the <strong className="text-white">2026 Gresham College Lecture</strong> and modern research into <strong className="text-white font-medium">Dr. Milton Mermikides</strong>, this model argues that we hear music in circles, not straight lines. It prioritizes perceptual harmony over physical frequency.
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Philosophical Mapping</h3>
                  <p className="text-sm leading-relaxed text-gray-300 font-light">
                    {isPhysics ? (
                      <>
                        Visible light spans almost exactly one octave. When shifted down <strong className="text-white">41 octaves</strong>, it sits around middle C. While mathematically pure, this linear mapping separates "High C" from "Low C," creating a spiral of color where each note has a unique physical "hue" based on its exact Terahertz frequency.
                      </>
                    ) : (
                      <>
                        Based on the 2026 Gresham College Lecture and modern research into <strong className="text-white">perceptual synesthesia</strong> by <strong className="text-white font-medium">Dr. Milton Mermikides</strong>, this model argues that we hear music in circles, not straight lines. It prioritizes perceptual harmony over physical frequency.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 border-t border-white/5 pt-8">
                {isPhysics ? (
                  <>
                    <a
                      href="https://www.gutenberg.org/files/33504/33504-h/33504-h.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                    >
                      NEWTON'S OPTICKS (1704)
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="https://www.gresham.ac.uk/sites/default/files/transcript/R_2026_01_12_1618_Mermikides_T_V3.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-5 py-2.5 text-[10px] font-bold tracking-widest text-pink-200 transition-all hover:bg-pink-500/20"
                    >
                      DOWNLOAD TRANSCRIPT (PDF)
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </a>
                    <a
                      href="https://www.gresham.ac.uk/watch-now/music-light-colour"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold tracking-widest text-white transition-all hover:bg-white/10"
                    >
                      LECTURE: MUSIC & COLOUR
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
