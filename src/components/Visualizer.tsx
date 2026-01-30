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
  mode = 'synth',
  analyser,
  waveform = 'sine',
}) => {
  // Helper to calculate bent frequency
  const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);

  const [amplitude, setAmplitude] = React.useState(0);
  const dataArrayRef = React.useRef<Uint8Array | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

  const isSaw = waveform === 'sawtooth' || waveform === 'square';

  React.useEffect(() => {
    if (!analyser) return;

    // Initialize data array only when analyser changes
    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    
    // Setup canvas with proper DPR for crisp rendering
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const dpr = window.devicePixelRatio || 1;
      const displaySize = 800;
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
      ctx.scale(dpr, dpr);
    }
    
    let animationId: number;

    const update = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const dataArray = dataArrayRef.current;

      if (analyser && dataArray) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteTimeDomainData(dataArray as any);

        // Calculate average amplitude for overall sizing
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setAmplitude(rms);

        // Draw Waveform
        if (ctx && canvas && hasActiveInput) {
          // Use logical size for drawing (DPR scaling already applied)
          const w = 800;
          const h = 800;
          const cx = w / 2;
          const cy = h / 2;

          ctx.clearRect(0, 0, w, h);
          ctx.beginPath();
          ctx.strokeStyle = blendColor;
          ctx.lineWidth = 4;
          ctx.lineCap = isSaw ? 'butt' : 'round';
          ctx.lineJoin = isSaw ? 'miter' : 'round';
          
          // Dynamics: Glow intensity linked to amplitude
          ctx.shadowBlur = 10 + (rms * 40);
          ctx.shadowColor = blendColor;

          const bufferLength = dataArray.length;
          const baseRadius = 100 + (rms * 100); // Dynamic scale

          if (!isSaw) {
            // SINE: Circular Waveform (Bouba)
            for (let i = 0; i <= bufferLength; i++) {
              const idx = i % bufferLength;
              const angle = (i / bufferLength) * Math.PI * 2;
              const v = (dataArray[idx] - 128) / 128;
              const r = baseRadius + (v * 45);
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          } else {
            // SAWTOOTH: Sharp Polygon (Kiki)
            // Draw a jagged star-like shape or polygon
            const sides = waveform === 'square' ? 4 : 3; // Square or Triangle base
            for (let i = 0; i <= bufferLength; i++) {
              const idx = i % bufferLength;
              const angle = (i / bufferLength) * Math.PI * 2;
              const v = (dataArray[idx] - 128) / 128;
              
              // Modulate radius with sawtooth jagginess
              const cornerSharpness = Math.cos(angle * sides);
              const r = baseRadius + (v * 60) + (cornerSharpness * 20);
              
              const x = cx + Math.cos(angle + amplitude) * r;
              const y = cy + Math.sin(angle + amplitude) * r;
              
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();

          // Internal Glow
          ctx.globalAlpha = 0.1 + (rms * 0.3);
          ctx.fillStyle = blendColor;
          ctx.fill();
          ctx.globalAlpha = 1.0;
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
  }, [analyser, blendColor, isSaw, hasActiveInput, waveform, amplitude]);

  // 1. Timbre Mapping
  const shapeStyle = isSaw
    ? {
      borderRadius: waveform === 'square' ? '4px' : '10%',
      transform: `rotate(${amplitude * 720}deg)`,
      border: '1px solid rgba(255,255,255,0.2)'
    }
    : { borderRadius: '50%' };

  const getOpacity = (freq: number) => {
    // Higher notes = more transparent/ethereal
    // Lower notes = more solid
    const normalized = Math.min(1, Math.max(0, (freq - 200) / 800));
    return 0.8 - (normalized * 0.6); // 0.8 at 200Hz, 0.2 at 1000Hz
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
                  initial={{ scale: 0, opacity: 1, borderWidth: '3px', rotate: isSaw ? 45 : 0 }}
                  animate={{
                    scale: rippleScale,
                    opacity: 0,
                    borderWidth: '0px',
                    rotate: isSaw ? 180 : 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute border box-content"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: '100px',
                    height: '100px',
                    x: '-50%',
                    y: '-50%',
                    borderRadius: isSaw ? (waveform === 'square' ? '4px' : '15%') : '50%',
                    borderColor: color,
                    boxShadow: `0 0 ${30 + amplitude * 100}px ${color}`,
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
                scale: (1 + (amplitude * 2.5)),
                opacity: getOpacity(primaryFrequency),
                filter: `blur(${isSaw ? 2 : 45}px) brightness(${1 + amplitude * 3})`,
                ...shapeStyle
              }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{
                duration: 0.1,
                opacity: { duration: 0.3 }
              }}
              className="absolute w-96 h-96 mix-blend-screen"
              style={{
                backgroundColor: isSaw ? 'transparent' : `${blendColor}44`,
                boxShadow: isSaw
                  ? `0 0 80px ${blendColor}88, inset 0 0 40px rgba(255,255,255,0.2)`
                  : `0 0 ${150 + amplitude * 250}px ${blendColor}AA`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Sharp Waveform Overlay */}
        <AnimatePresence>
          {hasActiveInput && (
            <motion.div
              key="main-orb-waveform"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: (1 + (amplitude * 2.5)),
                opacity: getOpacity(primaryFrequency),
                ...shapeStyle,
                transform: isSaw ? shapeStyle.transform : 'none',
                border: 'none',
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute w-96 h-96 mix-blend-screen pointer-events-none"
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full"
                style={{
                  filter: `blur(${isSaw ? 0.5 : 1.5}px) drop-shadow(0 0 15px ${blendColor})`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};