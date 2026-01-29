import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { frequencyToHSL, getMixColor, getLightStats } from '../utils/colors';
import { NOTES } from '../utils/notes';

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
  analyser?: AnalyserNode | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({ ripples, activeNotes, pitchBend = 0, analyser }) => {
  // Helper to calculate bent frequency
  const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);
  
  // Calculate blended chord color
  const currentBentFreqs = Array.from(activeNotes).map(getBentFreq);
  const blendColor = getMixColor(currentBentFreqs);

  // Canvas for Waveform
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Clear but keep transparent
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // We only draw if there's sound
      if (activeNotes.size === 0) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.lineWidth = 2;
      
      // 1. Draw "Light" Wave (High Frequency, Color)
      // We simulate light by drawing a wave that is much faster than the audio wave
      // The amplitude is modulated by the audio data
      ctx.beginPath();
      ctx.strokeStyle = blendColor;
      // Glow effect for light
      ctx.shadowBlur = 20;
      ctx.shadowColor = blendColor;

      const lightFreqMult = 20; // Simulate "higher frequency"
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0..2 (1 is center)
        const y = v * height/2;
        // Current slice percentage
        const x = (i / bufferLength) * width;
        
        // Add high freq sine modulation
        const lightMod = Math.sin(i * lightFreqMult) * 50 * (Math.abs(v - 1)); // Amplitude scales with volume
        
        if (i === 0) {
          ctx.moveTo(x, y + lightMod);
        } else {
          ctx.lineTo(x, y + lightMod);
        }
      }
      ctx.stroke();
      
      // Reset Shadow for next pass
      ctx.shadowBlur = 0;

      // 2. Draw "Sound" Wave (Real Audio Data, White)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2; // Map 0..2 to 0..height
        // Note: dataArray values are 0-255. 128 is silence.
        // v goes from 0 to 2. 1 is center.
        // if v=1, y = height/2. Perfect.

        const x = (i / bufferLength) * width;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [analyser, activeNotes, blendColor]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-black z-0 perspective-[1000px]">
      {/* Deep Space / Aurora Background */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 120, ease: "linear", repeat: Infinity }}
        className="absolute inset-[-50%] opacity-30 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg, ${blendColor} 0%, transparent 40%, ${blendColor} 80%, transparent 100%)`,
          filter: 'blur(100px)',
        }}
      />

      {/* Dynamic Background Pulse (Chord Color) */}
      <div className="absolute inset-0 flex items-center justify-center transition-colors duration-200 ease-linear">
         {activeNotes.size > 0 && (
           <div 
             className="w-full h-full opacity-15 blur-3xl mix-blend-screen transition-all duration-300"
             style={{ 
               backgroundColor: blendColor,
               transform: `scale(${1 + activeNotes.size * 0.05})`
             }} 
           />
         )}
      </div>

      {/* WAVEFORM CANVAS LAYER */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 mix-blend-screen opacity-80"
      />

      {/* Main 3D Scene Layer */}
      <div className="absolute inset-0 transform-style-3d rotate-x-[10deg]">
        <AnimatePresence>
          {ripples.map((ripple) => {
            const color = frequencyToHSL(getBentFreq(ripple.frequency));
            return (
              <React.Fragment key={ripple.id}>
                {/* PRISM EFFECT: Red Shift */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.5, borderWidth: '2px' }}
                  animate={{ scale: 5.1, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.1, 0.67, 0.83, 0.67] }}
                  className="absolute rounded-full border border-red-500/50 box-content mix-blend-screen"
                  style={{ left: ripple.x, top: ripple.y, width: '120px', height: '120px', x: '-50%', y: '-50%' }}
                />
                
                {/* PRISM EFFECT: Blue Shift */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.5, borderWidth: '2px' }}
                  animate={{ scale: 4.9, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.1, 0.67, 0.83, 0.67] }}
                  className="absolute rounded-full border border-blue-500/50 box-content mix-blend-screen"
                  style={{ left: ripple.x, top: ripple.y, width: '120px', height: '120px', x: '-50%', y: '-50%' }}
                />

                {/* Core shockwave */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.7, borderWidth: '4px' }}
                  animate={{ scale: 5, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.1, 0.67, 0.83, 0.67] }} // Explosive ease
                  className="absolute rounded-full border border-white box-content mix-blend-screen"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: '120px',
                    height: '120px',
                    x: '-50%',
                    y: '-50%',
                    borderColor: color,
                    boxShadow: `0 0 60px ${color}, inset 0 0 40px ${color}`,
                    background: `radial-gradient(circle, ${color} 0%, transparent 60%)`
                  }}
                />
                
                {/* Secondary delayed ring for "echo" effect */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.4, borderWidth: '1px' }}
                  animate={{ scale: 4, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, delay: 0.1, ease: "easeOut" }}
                  className="absolute rounded-full border border-white box-content mix-blend-screen"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: '100px',
                    height: '100px',
                    x: '-50%',
                    y: '-50%',
                    borderColor: color,
                  }}
                />

                {/* Burst particles (Trigonometry-based for reliability) */}
                {[...Array(6)].map((_, i) => {
                  const angle = i * 60 * (Math.PI / 180);
                  const targetX = Math.cos(angle) * 300;
                  const targetY = Math.sin(angle) * 300;
                  
                  return (
                    <motion.div
                      key={`${ripple.id}-p-${i}`}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{ 
                        scale: [0, 1, 0], 
                        x: targetX,
                        y: targetY
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute w-4 h-4 rounded-full blur-sm mix-blend-screen"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        marginLeft: '-0.5rem', // Center the 1rem (w-4) particle
                        marginTop: '-0.5rem',
                        backgroundColor: color,
                      }}
                    />
                  );
                })}

                {/* Floor Reflection (Mirror) */}
                <motion.div
                  initial={{ scaleX: 0, scaleY: 0, opacity: 0.2, borderWidth: '2px' }}
                  animate={{ scaleX: 5, scaleY: 1.5, opacity: 0, borderWidth: '0px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute rounded-[100%] border border-white/50 box-content mix-blend-overlay blur-sm"
                  style={{
                    left: ripple.x,
                    top: window.innerHeight - 100, // Anchor near bottom
                    width: '120px',
                    height: '120px',
                    x: '-50%',
                    y: '-50%',
                    borderColor: color,
                    transform: 'rotateX(60deg)' // Perspective flatten
                  }}
                />
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Active Note Info Overlay */}
      <div className="absolute inset-x-0 top-[15%] flex flex-col items-center z-[60] pointer-events-none">
        
        {/* Chord Sum Indicator */}
        <AnimatePresence>
          {activeNotes.size > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-4 flex flex-col items-center justify-center p-4 rounded-full backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <div 
                className="w-16 h-16 rounded-full shadow-[0_0_20px_currentColor] animate-pulse"
                style={{ backgroundColor: blendColor, color: blendColor }}
              />
              <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                Harmonic Blend
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {Array.from(activeNotes).map((freq) => {
            const note = NOTES.find(n => n.frequency === freq);
            const bentFreq = getBentFreq(freq);
            const color = frequencyToHSL(bentFreq);
            const { frequencyTHz, wavelengthNm, octaveShift } = getLightStats(bentFreq);

            return (
              <motion.div
                key={`info-${freq}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="mb-3 flex items-center gap-4 px-6 py-3 rounded-xl backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl"
              >
                {/* Color Swatch / Note Name */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                    style={{ backgroundColor: color, color: color }}
                  />
                  <span className="text-2xl font-light text-white tracking-widest">
                    {note?.note}
                  </span>
                </div>

                <div className="w-px h-8 bg-white/10" />

                {/* Technical Data */}
                <div className="flex flex-col items-start justify-center text-xs font-mono opacity-70 leading-tight">
                  <span className="text-white/90">{bentFreq.toFixed(1)} Hz</span>
                  <span className="text-white/50">{frequencyTHz.toFixed(1)} THz <span className="text-white/30 text-[10px] ml-1">(↑{octaveShift} Octaves)</span></span>
                  <span className="text-white/50 uppercase tracking-wider">{wavelengthNm} nm</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sustained Active Note Orbs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {Array.from(activeNotes).map((freq) => (
            <motion.div
              key={freq}
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ 
                scale: [1, 1.3, 1.1],
                opacity: 0.4,
                filter: 'blur(60px)'
              }}
              exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{ 
                duration: 0.3, 
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } 
              }}
              className="absolute w-64 h-64 rounded-full mix-blend-screen"
              style={{
                backgroundColor: frequencyToHSL(getBentFreq(freq)),
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
