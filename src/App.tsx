import { useState, useEffect, useCallback } from 'react';
import { Keyboard } from './components/Keyboard';
import { Visualizer, type Ripple } from './components/Visualizer';
import { Wheels } from './components/Wheels';
import { useAudio } from './utils/audio';
import { NOTES, type Note } from './utils/notes';

function App() {
  const { playTone, stopTone, initAudio, setPitchBend: setAudioPitch, analyser } = useAudio();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pitchBend, setPitchBend] = useState(0); // -2 to 2 semitones
  const [hasStarted, setHasStarted] = useState(false);

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

  // Physical Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handlePlay, handleStop, keyMap]);

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
      />
      
      {/* Info Panel */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-40 max-w-[200px] md:max-w-sm pointer-events-none select-none">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl shadow-xl transition-all">
          <h2 className="text-sm md:text-xl font-light text-white mb-2 tracking-wide border-b border-white/20 pb-2">
            Sound-to-Color Synesthesia
          </h2>
          <p className="text-[10px] md:text-sm text-gray-300 leading-relaxed font-light hidden md:block">
            <span className="font-semibold text-white/80">Chromesthesia</span> is where sound evokes color. 
            <br className="mb-3 block"/>
            <span className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-1 mb-1 block">The Math</span>
            Sound and Light are both just waves. To turn one into the other, we simply 
            <span className="text-white"> speed it up</span>.
            <br className="mt-2 block"/>
            By doubling the sound frequency roughly <span className="font-mono text-blue-300">40 times</span> (moving up 40 musical octaves), 
            the wave oscillates fast enough to leave the audible spectrum and enter the visible light spectrum.
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
            PRESS KEYS [A-Z], TAP, OR SCROLL PITCH
          </p>
        </div>
        
        {/* Controls Container */}
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
      </div>
    </div>
  );
}

export default App;