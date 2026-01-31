import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { frequencyToRGB, getMixColor, getHarmonicColor, getHarmonicMixColor } from '../utils/colors';

/**
 * Visualizer modes representing two competing worldviews on music-color correspondence:
 * - 'physics': Newtonian linear frequency mapping (Opticks, 1704)
 * - 'harmonic': Perceptual harmonic mapping via Circle of Fifths (Mermikides, 2026)
 * @see https://www.gutenberg.org/files/33504/33504-h/33504-h.htm
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 */
export type VisualizerMode = 'physics' | 'harmonic';

interface VisualizerProps {
  activeNotes: Set<number>;
  pitchBend?: number;
  /** Current visualization mode: physics (Newton) or harmonic (Mermikides) */
  mode?: VisualizerMode;
  analyser?: AnalyserNode | null;
  waveform?: OscillatorType;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  activeNotes,
  pitchBend = 0,
  mode = 'physics',
  analyser,
  waveform = 'sine',
}) => {
  // Helper to calculate bent frequency
  const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);

  const amplitude = useMotionValue(0);
  const opacity = useTransform(amplitude, [0, 1], [0.1, 0.6]);
  const scale = useTransform(amplitude, [0, 1], [1, 1.3]);
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
        amplitude.set(rms);
      }
      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, amplitude]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 perspective-[1000px]">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,1)_0%,rgba(0,0,0,1)_100%)]" />

      <motion.div
        style={{
          background: blendColor,
          opacity,
          scale,
        }}
        className="absolute inset-0 blur-[150px] mix-blend-screen pointer-events-none"
      />
    </div>
  );
};