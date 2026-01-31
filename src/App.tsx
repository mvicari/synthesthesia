import { useState, useEffect, useCallback } from 'react';
import { Keyboard } from './components/Keyboard';
import { Visualizer, type VisualizerMode } from './components/Visualizer';
import { Wheels } from './components/Wheels';
import { NoteInfoCard } from './components/NoteInfoCard';
import { ContextModal } from './components/ContextModal';
import { BoubaKikiTutorial } from './components/BoubaKikiTutorial';
import { OctaveJourney } from './components/OctaveJourney';
import { useAudio } from './utils/audio';
import { NOTES, type Note } from './utils/notes';

function App() {
  const { playTone, stopTone, initAudio, setPitchBend: setAudioPitch, setWaveform, analyser } = useAudio();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [pitchBend, setPitchBend] = useState(0); // -2 to 2 semitones
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<VisualizerMode>('physics');
  const [physicsSubMode, setPhysicsSubMode] = useState<'continuous' | '7band'>('continuous');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isBoubaKikiOpen, setIsBoubaKikiOpen] = useState(false);
  const [showOctaveJourney, setShowOctaveJourney] = useState(false);
  const [waveform, setWaveformState] = useState<OscillatorType>('sine');

  // Update Audio Engine when UI state changes
  useEffect(() => {
    setAudioPitch(pitchBend);
  }, [pitchBend, setAudioPitch]);

  // Mapping for keyboard lookup
  const keyMap = NOTES.reduce((acc, note) => {
    acc[note.key] = note;
    return acc;
  }, {} as Record<string, Note>);

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
    playTone(frequency);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.add(frequency);
      return newSet;
    });
  }, [playTone, initAudio, hasStarted, handleStart]);

  const handleStop = useCallback((frequency: number) => {
    stopTone(frequency);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(frequency);
      return newSet;
    });
  }, [stopTone]);

  // Mode toggle handler: Switch between Newtonian physics and Mermikides harmonic models
  const handleModeToggle = useCallback(() => {
    setMode(prev => prev === 'physics' ? 'harmonic' : 'physics');
  }, []);

  // Physical Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // M key toggles mode
      if (e.key.toLowerCase() === 'm' && !e.repeat) {
        handleModeToggle();
        return;
      }

      // V key toggles waveform (since W is C#)
      if (e.key.toLowerCase() === 'v' && !e.repeat) {
        const nextWave = waveform === 'sine' ? 'sawtooth' : 'sine';
        setWaveformState(nextWave);
        setWaveform(nextWave);
        return;
      }

      // O key toggles Octave Journey visualization
      if (e.key.toLowerCase() === 'o' && !e.repeat) {
        setShowOctaveJourney(prev => !prev);
        return;
      }

      // N key toggles Newton's 7-band mode (only in physics mode)
      if (e.key.toLowerCase() === 'n' && !e.repeat) {
        setPhysicsSubMode(prev => prev === 'continuous' ? '7band' : 'continuous');
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
        activeNotes={activeNotes}
        pitchBend={pitchBend}
        mode={mode}
        physicsSubMode={physicsSubMode}
        analyser={analyser.current}
        waveform={waveform}
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
          <div className="pointer-events-auto flex items-start gap-2">
            <div className="flex flex-col items-end gap-2">
              {/* Waveform Toggle */}
              <button
                onClick={() => {
                  const nextWave = waveform === 'sine' ? 'sawtooth' : 'sine';
                  setWaveformState(nextWave);
                  setWaveform(nextWave);
                }}
                className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono tracking-widest uppercase hover:bg-white/10 transition-all"
              >
                Timbre: <span className={waveform === 'sine' ? 'text-blue-300' : 'text-orange-400'}>{waveform}</span>
              </button>

              <button
                onClick={handleModeToggle}
                className={`
                  px-4 py-2 rounded-full border border-white/20 backdrop-blur-md 
                  text-xs font-mono tracking-widest uppercase transition-all duration-300
                  hover:bg-white/10 active:scale-95
                  ${mode === 'harmonic' ? 'shadow-[0_0_20px_rgba(236,72,153,0.3)] bg-pink-500/10 border-pink-500/30' : 'shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white/5'}
                `}
              >
                <span className="flex items-center gap-2">
                  {mode === 'physics' ? (
                    <>
                      <span className="text-base md:text-lg">🎹</span>
                      <span className="hidden sm:inline">NEWTON (1704 Physics)</span>
                      <span className="text-blue-300/40">•</span>
                      <span className="opacity-70">Octave Doubling</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base md:text-lg">🎨</span>
                      <span className="hidden sm:inline">MERMIKIDES (2026 Perceptual)</span>
                      <span className="text-pink-300/40">•</span>
                      <span className="opacity-70">Circle of Fifths</span>
                    </>
                  )}
                </span>
              </button>
              <p className="text-[8px] md:text-[10px] text-white/30 font-mono mt-1 text-center">
                Press [M] to toggle
              </p>

              {/* Newton 7-Band Mode Toggle (only visible in physics mode) */}
              {mode === 'physics' && (
                <button
                  onClick={() => setPhysicsSubMode(prev => prev === 'continuous' ? '7band' : 'continuous')}
                  className={`mt-2 px-3 py-1 rounded-full border text-[9px] font-mono tracking-wider transition-all ${physicsSubMode === '7band'
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                >
                  {physicsSubMode === '7band' ? '7-BAND (Newton)' : 'CONTINUOUS'}
                  <span className="ml-1 text-white/30">[N]</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsBoubaKikiOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                title="Bouba-Kiki Effect"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
              </button>

              <button
                onClick={() => setIsInfoOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                title="Theory & Context"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>
            </div>
          </div>
        </header>

        <div className={`z-50 w-full max-w-5xl mx-auto mb-4 md:mb-8 px-2 md:px-4 overflow-hidden pointer-events-none transition-all duration-500 ease-in-out`}>
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
        physicsSubMode={physicsSubMode}
        analyser={analyser.current}
        waveform={waveform}
      />

      <ContextModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        mode={mode}
      />

      <BoubaKikiTutorial
        isOpen={isBoubaKikiOpen}
        onClose={() => setIsBoubaKikiOpen(false)}
      />

      {/* Octave Journey - "Slowed Down Light" visualization (toggle with [O]) */}
      <OctaveJourney
        frequency={activeNotes.size > 0 ? Array.from(activeNotes)[0] * Math.pow(2, pitchBend / 12) : 0}
        isVisible={showOctaveJourney && activeNotes.size > 0}
      />
    </div>
  );
}

export default App;