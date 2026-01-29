import { useState, useEffect, useCallback } from 'react';
import { Keyboard } from './components/Keyboard';
import { Visualizer, type Ripple, type VisualizerMode } from './components/Visualizer';
import { Wheels } from './components/Wheels';
import { useAudio } from './utils/audio';
import { useMicrophone } from './utils/microphone';
import { NOTES, type Note } from './utils/notes';

function App() {
  const { playTone, stopTone, initAudio, setPitchBend: setAudioPitch, analyser, audioContext } = useAudio();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pitchBend, setPitchBend] = useState(0); // -2 to 2 semitones
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<VisualizerMode>('synth');

  // Microphone hook - shares the same AudioContext
  const mic = useMicrophone(audioContext.current);

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
    // Only play synth tones in synth mode
    if (mode !== 'synth') return;

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
  }, [playTone, initAudio, addRipple, hasStarted, handleStart, mode]);

  const handleStop = useCallback((frequency: number) => {
    stopTone(frequency);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(frequency);
      return newSet;
    });
  }, [stopTone]);

  // Mode toggle handler
  const handleModeToggle = useCallback(async () => {
    if (mode === 'synth') {
      // Switch to mic mode
      if (!hasStarted) {
        handleStart();
      }
      initAudio();
      const success = await mic.startMicrophone();
      if (success) {
        // Stop any playing synth notes
        activeNotes.forEach(freq => stopTone(freq));
        setActiveNotes(new Set());
        setMode('mic');
      }
    } else {
      // Switch to synth mode
      mic.stopMicrophone();
      setMode('synth');
    }
  }, [mode, hasStarted, handleStart, initAudio, mic, activeNotes, stopTone]);

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
  }, [handlePlay, handleStop, keyMap, handleModeToggle]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default to stop page scrolling if overflow wasn't hidden
      // e.preventDefault(); 
      setPitchBend(prev => Math.max(-2, Math.min(2, prev - e.deltaY * 0.005)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col justify-end overflow-hidden w-full h-full">

      {/* Start Overlay */}
      {!hasStarted && (
        <div
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500"
          onClick={handleStart}
          onTouchStart={handleStart}
        >
          <div className="p-8 border border-white/20 rounded-2xl bg-black/50 hover:bg-white/10 transition-colors group">
            <h1 className="text-3xl font-light tracking-[0.5em] text-white mb-4 text-center group-hover:scale-105 transition-transform duration-300">
              SYNTHESTHESIA
            </h1>
            <p className="text-center text-white/50 font-mono text-sm tracking-widest group-hover:text-white transition-colors">
              TAP TO ENTER
            </p>
          </div>
        </div>
      )}

      <Visualizer
        ripples={ripples}
        activeNotes={activeNotes}
        pitchBend={pitchBend}
        analyser={analyser.current}
        mode={mode}
        micFrequency={mic.frequency}
        micConfidence={mic.confidence}
      />

      {/* Mode Toggle - Top Right */}
      {hasStarted && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <button
            onClick={handleModeToggle}
            className={`
              px-4 py-2 md:px-6 md:py-3 rounded-xl font-mono text-xs md:text-sm tracking-wider
              backdrop-blur-xl border transition-all duration-300 cursor-pointer select-none
              ${mode === 'synth'
                ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
                : 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-400/40 text-pink-300 hover:border-pink-400/60'
              }
            `}
          >
            <span className="flex items-center gap-2 md:gap-3">
              {mode === 'synth' ? (
                <>
                  <span className="text-base md:text-lg">🎹</span>
                  <span className="hidden sm:inline">SYNTH</span>
                  <span className="text-white/40">•</span>
                  <span className="opacity-50">Physics</span>
                </>
              ) : (
                <>
                  <span className="text-base md:text-lg">🎤</span>
                  <span className="hidden sm:inline">MIC</span>
                  <span className="text-pink-300/40">•</span>
                  <span className="opacity-70">Harmonic</span>
                </>
              )}
            </span>
          </button>
          <p className="text-[8px] md:text-[10px] text-white/30 font-mono mt-1 text-center">
            Press [M] to toggle
          </p>
        </div>
      )}

      {/* Mic Error Display */}
      {mic.error && (
        <div className="absolute top-20 right-4 md:top-24 md:right-8 z-50 max-w-xs">
          <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 backdrop-blur-xl">
            <p className="text-red-300 text-xs font-mono">{mic.error}</p>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-40 max-w-[200px] md:max-w-sm pointer-events-none select-none">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl shadow-xl transition-all">
          <h2 className="text-sm md:text-xl font-light text-white mb-2 tracking-wide border-b border-white/20 pb-2">
            {mode === 'synth' ? 'Physics Mode' : 'Harmonic Mode'}
          </h2>
          <p className="text-[10px] md:text-sm text-gray-300 leading-relaxed font-light hidden md:block">
            {mode === 'synth' ? (
              <>
                <span className="font-semibold text-white/80">Chromesthesia</span> — the experience of "seeing" music as color.
                <br className="mb-3 block" />
                <span className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-1 mb-1 block">How It Works</span>
                Sound and light are both <span className="text-blue-300">waves</span> — sound is just much slower.
                If you could speed up a musical note by doubling it <span className="font-mono text-blue-300">~40 times</span>,
                it would vibrate fast enough to become <span className="text-white">visible light</span>.
                <br className="mt-2 block" />
                That's exactly what we do here: each note's color is its <span className="italic">literal</span> light equivalent.
                <br className="mt-3 block" />
                <span className="text-[10px] text-white/40">Inspired by the physics of wave harmonics.</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-pink-300">Circle of Fifths</span> — color based on <span className="text-white">musical harmony</span>, not physics.
                <br className="mb-3 block" />
                <span className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-1 mb-1 block">How It Works</span>
                Notes that sound <span className="text-pink-300">good together</span> (like C & G) get <span className="text-white">neighboring colors</span>.
                <br className="mt-2 block" />
                This follows the <span className="font-mono text-pink-300">Circle of Fifths</span> — a map musicians use to find harmonies.
                Jump 7 semitones (a "fifth") and you land on the next color in the wheel.
                <br className="mt-3 block" />
                <span className="text-[10px] text-white/40">Inspired by the work of <span className="text-pink-300/70">Milton Mermikides</span> on musical-visual perception.</span>
              </>
            )}
          </p>
          <p className="text-[10px] text-gray-400 md:hidden">
            (Desktop view for full info)
          </p>
        </div>
      </div>

      <div className="z-50 w-full max-w-5xl mx-auto mb-4 md:mb-8 px-2 md:px-4 overflow-hidden">
        <div className="mb-2 md:mb-4 text-center">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-light tracking-tight sm:tracking-[0.3em] md:tracking-[0.5em] text-white opacity-80 mix-blend-difference truncate">
            SYNTHESTHESIA
          </h1>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2 font-mono opacity-50">
            {mode === 'synth'
              ? 'PRESS KEYS [A-Z], TAP, OR SCROLL PITCH'
              : 'SING OR PLAY INTO YOUR MICROPHONE'
            }
          </p>
        </div>

        {/* Controls Container - Only show in synth mode */}
        {mode === 'synth' && (
          <div className="flex gap-1 md:gap-4 items-end justify-center w-full max-w-full overflow-hidden">
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
        )}

        {/* Mic Mode: Show listening indicator */}
        {mode === 'mic' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`
              w-24 h-24 rounded-full border-2 flex items-center justify-center
              transition-all duration-300
              ${mic.confidence > 0.1
                ? 'border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.4)] scale-110'
                : 'border-white/20 scale-100'
              }
            `}>
              <span className="text-4xl">🎤</span>
            </div>
            <p className="text-white/50 text-sm font-mono mt-4">
              {mic.confidence > 0.1 ? 'Listening...' : 'Start singing or playing'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;