import React from 'react';
import type { Note } from '../utils/notes';
import { frequencyToHSL } from '../utils/colors';

interface KeyboardProps {
  notes: Note[];
  activeNotes: Set<number>;
  onPlay: (frequency: number) => void;
  onStop: (frequency: number) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ notes, activeNotes, onPlay, onStop }) => {
  // Track active touches to enable "sliding" across keys
  const activeTouches = React.useRef<Map<number, number>>(new Map());

  const getFrequencyFromPoint = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y);
    const keyElement = element?.closest('[data-frequency]');
    return keyElement ? parseFloat(keyElement.getAttribute('data-frequency') || '0') : null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach(touch => {
      const freq = getFrequencyFromPoint(touch.clientX, touch.clientY);
      if (freq) {
        activeTouches.current.set(touch.identifier, freq);
        onPlay(freq);
      }
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach(touch => {
      const oldFreq = activeTouches.current.get(touch.identifier);
      const newFreq = getFrequencyFromPoint(touch.clientX, touch.clientY);

      if (newFreq !== oldFreq) {
        if (oldFreq) onStop(oldFreq);
        if (newFreq) onPlay(newFreq);

        if (newFreq) {
          activeTouches.current.set(touch.identifier, newFreq);
        } else {
          activeTouches.current.delete(touch.identifier);
        }
      }
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach(touch => {
      const freq = activeTouches.current.get(touch.identifier);
      if (freq) {
        onStop(freq);
        activeTouches.current.delete(touch.identifier);
      }
    });
  };

  const isMouseDown = React.useRef(false);

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDown.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      className="flex justify-center items-end h-28 md:h-48 w-full md:w-auto select-none relative bg-gray-900 p-1 md:p-4 rounded-t-lg md:rounded-t-xl shadow-2xl touch-none"
      style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {notes.map((note) => {
        const isActive = activeNotes.has(note.frequency);
        const color = frequencyToHSL(note.frequency);

        const baseClass = "relative border border-gray-900 rounded-b-sm md:rounded-b-md transition-all duration-100 cursor-pointer z-10";

        // White keys: Flex-1 allows them to shrink on mobile, max-w-12 keeps them looking like the original on desktop
        const whiteClass = `h-full flex-1 md:w-12 min-w-[16px] max-w-12 bg-white text-black hover:bg-gray-100 active:scale-95 origin-top ${isActive ? '!bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : ''}`;

        // Black keys: Fixed widths relative to the responsive breakpoints.
        // -mx-[X] pulls them over the white keys.
        const blackClass = `h-[60%] w-4 md:w-8 bg-black text-white -mx-[8px] md:-mx-4 z-20 hover:bg-gray-800 active:scale-95 origin-top ${isActive ? '!bg-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`;

        const isBlack = note.type === 'black';

        return (
          <div
            key={note.note + note.frequency}
            data-frequency={note.frequency}
            className={`${baseClass} ${isBlack ? blackClass : whiteClass}`}
            style={{
              backgroundColor: isActive ? color : undefined,
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
            }}
            onMouseDown={() => { isMouseDown.current = true; onPlay(note.frequency); }}
            onMouseEnter={() => { if (isMouseDown.current) onPlay(note.frequency); }}
            onMouseLeave={() => onStop(note.frequency)}
            onMouseUp={() => { isMouseDown.current = false; onStop(note.frequency); }}
          >
            <span className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 text-[6px] md:text-xs opacity-50 font-mono pointer-events-none mix-blend-difference">
              {note.key.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
