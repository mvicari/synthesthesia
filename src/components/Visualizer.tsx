import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
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

  // Performance Optimization: Use useMotionValue for smooth background updates without re-renders
  const amplitude = useMotionValue(0);
  const opacity = useTransform(amplitude, [0, 1], [0.1, 0.6]);
  const scale = useTransform(amplitude, [0, 1], [1, 1.3]);
  const orbScale = useTransform(amplitude, [0, 1], [1, 1.5]);
  const orbFilter = useTransform(amplitude, [0, 1], [`blur(45px) brightness(1)`, `blur(45px) brightness(1.5)`]);

  const dataArrayRef = useRef<Uint8Array | null>(null);
  const smoothedAmplitude = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSaw = waveform === 'sawtooth' || waveform === 'square';

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

  // Store stable refs for the animation loop to avoid restarting it
  const renderConfig = useRef({ blendColor, isSaw, waveform, hasActiveInput });
  useEffect(() => {
    renderConfig.current = { blendColor, isSaw, waveform, hasActiveInput };
  }, [blendColor, isSaw, waveform, hasActiveInput]);

  useEffect(() => {
    if (!analyser) return;

    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    let animationId: number;

    const update = () => {
      const dataArray = dataArrayRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const config = renderConfig.current;

      if (analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray as any);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Asymmetric Smoothing (Fast Attack, Slow Decay)
        const targetAmp = rms;
        const isAttack = targetAmp > smoothedAmplitude.current;
        // Fast attack (0.3) for responsiveness, slow decay (0.05) for smoothness
        const smoothingFactor = isAttack ? 0.3 : 0.05;
        smoothedAmplitude.current = smoothedAmplitude.current * (1 - smoothingFactor) + targetAmp * smoothingFactor;
        amplitude.set(smoothedAmplitude.current);

        // Draw waveform visualization
        if (ctx && canvas && config.hasActiveInput) {
          const dpr = window.devicePixelRatio || 1;
          const width = window.innerWidth;
          const height = 400;

          if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
          }

          ctx.clearRect(0, 0, width, height);
          ctx.beginPath();
          ctx.strokeStyle = config.blendColor;
          ctx.lineWidth = config.isSaw ? 2 : 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 20;
          ctx.shadowColor = config.blendColor;

          const cy = height / 2;
          const bufferLength = dataArray.length;
          // Scale amplitude for visibility
          const ampScale = 150 + (smoothedAmplitude.current * 100);

          for (let i = 0; i < bufferLength; i++) {
            const x = (i / bufferLength) * width;

            // Apply Hann Window to taper edges (0 at start/end, 1 in middle)
            // w(n) = 0.5 * (1 - cos(2*pi*n/(N-1)))
            const windowVal = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (bufferLength - 1)));

            const rawVal = (dataArray[i] - 128) / 128;
            const val = rawVal * windowVal;

            const y = cy + (val * ampScale);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, amplitude]); // Render config is reading from ref, so no dependency needed

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 perspective-[1000px]">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,1)_0%,rgba(0,0,0,1)_100%)]" />

      {/* Background Ambience */}
      <motion.div
        style={{
          background: blendColor,
          opacity,
          scale,
        }}
        className="absolute inset-0 blur-[150px] mix-blend-screen pointer-events-none"
      />

      {/* Sustained Active Note Orb - Kept as background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {hasActiveInput && (
            <motion.div
              key="main-orb-glow"
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{
                scale: 1,
                opacity: 0.6, // Reduced opacity since it's now just a backing glow
                filter: 'blur(60px)', // Softer glow
              }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
              className="absolute w-96 h-96 mix-blend-screen rounded-full"
              style={{
                backgroundColor: `${blendColor}44`,
                boxShadow: `0 0 150px ${blendColor}AA`,
                scale: orbScale,
                filter: orbFilter
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Waveform Visualization Overlay - Full Width */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] pointer-events-none"
          style={{
            filter: `drop-shadow(0 0 15px ${blendColor})`,
            opacity: hasActiveInput ? 0.9 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};