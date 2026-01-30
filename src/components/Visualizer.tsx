import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { frequencyToRGB, getMixColor, getHarmonicColor, getHarmonicMixColor } from '../utils/colors';

/**
 * Visualizer modes representing two competing worldviews on music-color correspondence:
 * - 'physics': Newtonian linear frequency mapping (Opticks, 1704)
 * - 'harmonic': Perceptual harmonic mapping via Circle of Fifths (Mermikides, 2026)
 * @see https://www.gutenberg.org/files/33504/33504-h/33504-h.htm
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 */
export type VisualizerMode = 'physics' | 'harmonic';

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
  /** Current visualization mode: physics (Newton) or harmonic (Mermikides) */
  mode?: VisualizerMode;
  analyser?: AnalyserNode | null;
  waveform?: OscillatorType;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  ripples,
  activeNotes,
  pitchBend = 0,
  mode = 'physics',
  analyser,
}) => {
  // Helper to calculate bent frequency
  const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);

  const [amplitude, setAmplitude] = React.useState(0);
  const dataArrayRef = React.useRef<Uint8Array | null>(null);

  // Determine Active Inputs
  const hasActiveInput = activeNotes.size > 0;

  // Determine Primary Frequency and All Active Frequencies
  let primaryFrequency = 0;
  const allActiveFreqs: number[] = [];

  if (hasActiveInput) {
    const freqs = Array.from(activeNotes).map(getBentFreq);
    primaryFrequency = freqs[0];
    allActiveFreqs.push(...freqs);
  }

  // Calculate Color based on Mode (Theory)
  let blendColor = 'transparent';
  if (primaryFrequency > 0) {
    if (mode === 'harmonic') {
      blendColor = allActiveFreqs.length > 1 ? getHarmonicMixColor(allActiveFreqs) : getHarmonicColor(primaryFrequency);
    } else {
      if (allActiveFreqs.length > 1) {
        blendColor = getMixColor(allActiveFreqs);
      } else {
        blendColor = frequencyToRGB(primaryFrequency);
      }
    }
  }

  React.useEffect(() => {
    if (!analyser) return;

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
        setAmplitude(rms);
      }
      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, hasActiveInput]);

  const getOpacity = (freq: number) => {
    const normalized = Math.min(1, Math.max(0, (freq - 200) / 800));
    return 0.7 - (normalized * 0.4);
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 perspective-[1000px]">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,1)_0%,rgba(0,0,0,1)_100%)]" />

      <motion.div
        animate={{
          opacity: [0.1, 0.2 + (amplitude * 0.3), 0.1],
          scale: [1, 1.05 + (amplitude * 0.2), 1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{ background: blendColor }}
        className="absolute inset-0 blur-[150px] mix-blend-screen pointer-events-none opacity-20"
      />

      {/* RIPPLES LAYER */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {ripples.map((ripple) => {
            const freq = getBentFreq(ripple.frequency);
            const color = mode === 'harmonic' ? getHarmonicColor(freq) : frequencyToRGB(freq);
            const noteOpacity = getOpacity(freq);
            const rippleScale = 4 + (amplitude * 8);

            return (
              <React.Fragment key={ripple.id}>
                <motion.div
                  initial={{ scale: 0, opacity: 0.8, borderWidth: '2px' }}
                  animate={{
                    scale: rippleScale,
                    opacity: 0,
                    borderWidth: '0px',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute border box-content rounded-full"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: '80px',
                    height: '80px',
                    x: '-50%',
                    y: '-50%',
                    borderColor: color,
                    boxShadow: `0 0 ${20 + amplitude * 60}px ${color}`,
                    opacity: noteOpacity,
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
              key="main-orb-glow"
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{
                scale: (1 + (amplitude * 2)),
                opacity: getOpacity(primaryFrequency),
                filter: `blur(45px) brightness(${1 + amplitude * 2})`,
              }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{
                duration: 0.1,
                opacity: { duration: 0.3 }
              }}
              className="absolute w-96 h-96 mix-blend-screen rounded-full"
              style={{
                backgroundColor: `${blendColor}44`,
                boxShadow: `0 0 ${150 + amplitude * 200}px ${blendColor}AA`,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};