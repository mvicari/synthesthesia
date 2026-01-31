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
        amplitude.set(rms);

        // Draw waveform visualization
        if (ctx && canvas && config.hasActiveInput) {
          const dpr = window.devicePixelRatio || 1;
          const size = 400;

          if (canvas.width !== size * dpr) {
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
            ctx.scale(dpr, dpr);
          }

          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.strokeStyle = config.blendColor;
          ctx.lineWidth = config.isSaw ? 2 : 3;
          ctx.lineCap = config.isSaw ? 'butt' : 'round';
          ctx.lineJoin = config.isSaw ? 'miter' : 'round';
          ctx.shadowBlur = 20;
          ctx.shadowColor = config.blendColor;

          const cx = size / 2;
          const cy = size / 2;
          const bufferLength = dataArray.length;
          const baseRadius = 80 + (rms * 60);

          if (!config.isSaw) {
            // SINE: Smooth circular waveform (Bouba)
            for (let i = 0; i <= bufferLength; i++) {
              const idx = i % bufferLength;
              const angle = (i / bufferLength) * Math.PI * 2;
              const v = (dataArray[idx] - 128) / 128;
              const r = baseRadius + (v * 30);
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          } else {
            // Sawtooth Loop
            const time = Date.now() / 1000;
            const energy = Math.pow(rms, 0.7);
            const baseTeeth = config.waveform === 'square' ? 4 : 6;
            const dynamicTeeth = baseTeeth + Math.floor(energy * 24);
            const teeth = dynamicTeeth;
            const toothDepth = 20 + (energy * 60);
            const rotationSpeed = 0.5 + (energy * 2);
            const rotationOffset = time * rotationSpeed;
            const secondaryMod = Math.sin(time * 3) * 0.3 * energy;

            for (let i = 0; i <= bufferLength; i++) {
              const idx = i % bufferLength;
              const angle = (i / bufferLength) * Math.PI * 2 + rotationOffset;
              const v = (dataArray[idx] - 128) / 128;
              const sawPhase = (angle * teeth) % (Math.PI * 2);
              let sawValue;
              const dutyCycle = config.waveform === 'square'
                ? 0.3 + (energy * 0.4) + (secondaryMod * 0.2)
                : 0.05 + (energy * 0.35) + (secondaryMod * 0.15);
              if (sawPhase < Math.PI * 2 * dutyCycle) {
                sawValue = Math.pow(sawPhase / (Math.PI * 2 * dutyCycle), 0.7) * 2 - 1;
              } else {
                sawValue = (Math.pow((Math.PI * 2 - sawPhase) / (Math.PI * 2 * (1 - dutyCycle)), 0.7)) * 2 - 1;
              }
              const tertiaryMod = Math.sin(angle * teeth * 3 + time * 5) * 5 * energy;
              const r = baseRadius + (v * 25) + (sawValue * toothDepth) + tertiaryMod;
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
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

      {/* Sustained Active Note Orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {hasActiveInput && (
            <motion.div
              key="main-orb-glow"
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{
                scale: 1, // We map the rest via styles, or we could map amplitude here if we want React reactivity, but trying to avoid it.
                // Actually, framer-motion AnimatePresence requires `animate` to work for entry/exit.
                // Let's use simple entry/exit and let style/canvas do the heavy lifting.
                opacity: 0.8,
                filter: 'blur(45px)',
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

        {/* Waveform Visualization Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute pointer-events-none"
          style={{
            width: '400px',
            height: '400px',
            filter: `blur(${isSaw ? 0.5 : 1}px) drop-shadow(0 0 10px ${blendColor})`,
            opacity: hasActiveInput ? 0.8 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};