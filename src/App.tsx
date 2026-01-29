import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Keyboard } from './components/Keyboard';
import { Visualizer, type Ripple, type VisualizerMode } from './components/Visualizer';
import { Wheels } from './components/Wheels';
import { NoteInfoCard } from './components/NoteInfoCard';
import { useAudio } from './utils/audio';
import { NOTES, type Note } from './utils/notes';

function App() {
  const { playTone, stopTone, initAudio, setPitchBend: setAudioPitch } = useAudio();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pitchBend, setPitchBend] = useState(0); // -2 to 2 semitones
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<VisualizerMode>('synth');
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  // Update Audio Engine when UI state changes
  useEffect(() => {
    setAudioPitch(pitchBend);
  }, [pitchBend, setAudioPitch]);

  // Mapping for keyboard lookup
  const keyMap = NOTES.reduce((acc, note) => {
    acc[note.key] = note;
    return acc;
  }, {} as Record<string, Note>);

  const addRipple = useCallback((frequency: number) => {
    const id = Date.now().toString() + Math.random();
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    const newRipple: Ripple = { id, frequency, x, y };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 2000);
  }, []);

  const handleStart = useCallback(() => {
    if (hasStarted) return;
    console.log("Starting app...");
    initAudio();
    setHasStarted(true);
  }, [initAudio, hasStarted]);

  const handlePlay = useCallback((frequency: number) => {
    if (!hasStarted) {
      handleStart();
    }
    initAudio();
    playTone(frequency);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.add(frequency);
      return newSet;
    });
    addRipple(frequency);
  }, [playTone, initAudio, addRipple, hasStarted, handleStart]);

  const handleStop = useCallback((frequency: number) => {
    stopTone(frequency);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(frequency);
      return newSet;
    });
  }, [stopTone]);

  // Mode toggle handler
  const handleModeToggle = useCallback(() => {
    if (mode === 'synth') {
      setMode('mic'); // 'mic' mode key now represents 'Harmonic Mode'
    } else {
      setMode('synth');
    }
  }, [mode]);

  // Physical Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // M key toggles mode
      if (e.key.toLowerCase() === 'm' && !e.repeat) {
        handleModeToggle();
        return;
      }

      if (e.repeat) {
        // Handle rapid pitch change on hold
        if (e.key === '-' || e.key === '_') {
          setPitchBend(prev => Math.max(-2, prev - 0.05));
          return;
        }
        if (e.key === '=' || e.key === '+') {
          setPitchBend(prev => Math.min(2, prev + 0.05));
          return;
        }
        return;
      };

      // Pitch Bend Controls
      if (e.key === '-' || e.key === '_') {
        setPitchBend(prev => Math.max(-2, prev - 0.1));
        return;
      }
      if (e.key === '=' || e.key === '+') {
        setPitchBend(prev => Math.min(2, prev + 0.1));
        return;
      }

      const note = keyMap[e.key.toLowerCase()];
      if (note) {
        handlePlay(note.frequency);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyMap[e.key.toLowerCase()];
      if (note) {
        handleStop(note.frequency);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePlay, handleStop, handleModeToggle, keyMap]);

  // Mouse Wheel Pitch Control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser zoom/nav gestures if possible (though overflow-hidden helps)
      // e.preventDefault(); // Note: passive listener cannot prevent default, but we're mostly fine.

      const sensitivity = 0.005;
      // Invert deltaY so scrolling UP (negative delta) INCREASES pitch
      // This feels more "upward"
      setPitchBend(prev => Math.max(-2, Math.min(2, prev - e.deltaY * sensitivity)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);



  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans selection:bg-pink-500/30">

      {/* Visualizer Background */}
      <Visualizer
        ripples={ripples}
        activeNotes={activeNotes}
        pitchBend={pitchBend}
        mode={mode}
      />

      {/* Start Overlay */}
      {!hasStarted && (
        <div
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500"
          onClick={handleStart}
          onTouchStart={() => { 
            // Do not preventDefault here to allow handleStart to be called via onClick if needed,
            // but on iOS, touchstart is the best way to resume audio context.
            handleStart(); 
          }}
        >
          <div className="p-8 border border-white/20 rounded-2xl bg-black/50 hover:bg-white/10 transition-colors group max-w-[90vw]">
            <h1 className="text-xl md:text-3xl font-light tracking-widest md:tracking-[0.5em] text-white mb-4 text-center group-hover:scale-105 transition-transform duration-300 break-words">
              SYNTHESTHESIA
            </h1>
            <p className="text-center text-white/50 font-mono text-sm tracking-widest group-hover:text-white transition-colors">
              TAP TO ENTER
            </p>
            <p className="mt-8 text-[9px] md:text-[10px] text-white/20 font-mono uppercase tracking-[0.2em] text-center max-w-[250px] mx-auto leading-relaxed border-t border-white/5 pt-4">
              Note: Ensure silent mode is <span className="text-white/40">OFF</span> (Ringer ON) for audio on iOS devices.
            </p>
          </div>
        </div>
      )}

      {/* Main UI Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between pointer-events-none">

        {/* Header */}
        <header className="p-4 md:p-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl md:text-4xl font-thin tracking-[0.2em] uppercase text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              Synthesthesia
            </h1>
            <p className="text-xs md:text-sm text-white/40 tracking-wider font-light mt-1 ml-1">
              Audio-Visual Frequency Mapper
            </p>
          </div>

          {/* Mode Toggle Switch */}
          <div className="pointer-events-auto flex flex-col items-end">
            <button
              onClick={handleModeToggle}
              className={`
                px-4 py-2 rounded-full border border-white/20 backdrop-blur-md 
                text-xs font-mono tracking-widest uppercase transition-all duration-300
                hover:bg-white/10 active:scale-95
                ${mode === 'mic' ? 'shadow-[0_0_20px_rgba(236,72,153,0.3)] bg-pink-500/10 border-pink-500/30' : 'shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white/5'}
              `}
            >
              <span className="flex items-center gap-2">
                {mode === 'synth' ? (
                  <>
                    <span className="text-base md:text-lg">🎹</span>
                    <span className="hidden sm:inline">PHYSICS</span>
                    <span className="text-blue-300/40">•</span>
                    <span className="opacity-70">Octave Doubling</span>
                  </>
                ) : (
                  <>
                    <span className="text-base md:text-lg">🎨</span>
                    <span className="hidden sm:inline">HARMONIC</span>
                    <span className="text-pink-300/40">•</span>
                    <span className="opacity-70">Circle of Fifths</span>
                  </>
                )}
              </span>
            </button>
            <p className="text-[8px] md:text-[10px] text-white/30 font-mono mt-1 text-center">
              Press [M] to toggle
            </p>
          </div>
        </header>

        {/* Center - Info Panel (Interactive on Mobile) */}
        {/* Changed from top-1/2 to top-24/32 to avoid overlap with center visualizer */}
        <div className={`absolute top-24 md:top-32 left-4 md:left-8 z-40 transition-all duration-300 ${mobileInfoOpen ? 'max-w-[85vw]' : 'max-w-[200px]'} md:max-w-sm pointer-events-none select-none`}>
          {/* Note Info is handled by Visualizer component now */}

          <motion.div
            layout
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
            className={`
              backdrop-blur-xl bg-black/20 border border-white/5 p-5 md:p-6 rounded-3xl shadow-2xl 
              pointer-events-auto cursor-pointer md:cursor-default overflow-hidden ring-1 ring-white/5
            `}
          >
            <motion.div layout="position" className="flex items-center justify-between">
              <h2 className="text-sm md:text-xl font-light text-white mb-2 tracking-wide border-b border-white/20 pb-2 flex-grow">
                {mode === 'synth' ? 'Physics Mode' : 'Harmonic Mode'}
              </h2>
              <motion.span
                animate={{ rotate: mobileInfoOpen ? 180 : 0 }}
                className="md:hidden text-white/50 ml-2 mb-2"
              >
                ▼
              </motion.span>
            </motion.div>

            <motion.div
              layout
              initial={false}
              animate={window.innerWidth >= 768 ? "desktop" : (mobileInfoOpen ? "expanded" : "collapsed")}
              variants={{
                collapsed: { height: 0, opacity: 0 },
                expanded: { height: 'auto', opacity: 1 },
                desktop: { height: 'auto', opacity: 1 }
              }}
              className="text-[10px] md:text-sm text-gray-300 leading-relaxed font-light origin-top"
            >
              {mode === 'synth' ? (
                <>
                  <span className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-1 mb-1 block">The Theory</span>
                  Sound and light are both <span className="text-blue-300">waves</span>. <br />
                  If you double a note's frequency ~40 times (octave doubling), it matches a specific color of light.
                  <br className="mt-2 block" />
                  This mode visualizes the <span className="font-mono text-blue-300">literal color</span> of sound.
                  <br className="mt-3 block" />
                  {/* <span className="text-[10px] text-white/40">Based on the theories of <span className="text-blue-300/70">Sir Isaac Newton</span>.</span> */}
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-1 mb-1 block">The Theory</span>
                  Colors are mapped by <span className="text-pink-300">harmonic relationship</span> rather than physics.
                  <br className="mt-2 block" />
                  Notes a <span className="font-mono text-pink-300">Perfect Fifth</span> apart (like C and G) appear as adjacent colors.
                  This mirrors how our ears perceive <span className="text-white">musical consonance</span>.
                  <br className="mt-3 block" />
                  <span className="text-[10px] text-white/40">Based on the research of <span className="text-pink-300/70">Dr. Milton Mermikides</span>.</span>
                </>
              )}
            </motion.div>

            {!mobileInfoOpen && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-pink-300/70 md:hidden mt-1 font-mono tracking-wider"
              >
                Tap to explore theory
              </motion.p>
            )}
          </motion.div>
        </div>

        <div className={`z-50 w-full max-w-5xl mx-auto mb-4 md:mb-8 px-2 md:px-4 overflow-hidden pointer-events-none transition-all duration-500 ease-in-out ${mobileInfoOpen ? 'blur-md opacity-30 scale-95' : ''}`}>
          <div className="mb-2 md:mb-4 text-center">
            <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2 font-mono opacity-50">
              PRESS KEYS [A-Z], TAP, OR SCROLL PITCH
            </p>
          </div>

          {/* Controls Container - Show in BOTH modes now */}
          <div className="flex gap-1 md:gap-4 items-end justify-center w-full max-w-full overflow-hidden pointer-events-auto">
            <Wheels
              onPitchBend={setPitchBend}
              pitchBend={pitchBend}
            />
            <Keyboard
              notes={NOTES}
              activeNotes={activeNotes}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          </div>
        </div>
      </div>


      {/* Note Info Card - Rendered last to stay on top (z-50) */}
      <NoteInfoCard
        activeNotes={activeNotes}
        pitchBend={pitchBend}
        mode={mode}
      />
    </div >
  );
}

export default App;