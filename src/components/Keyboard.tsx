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
  return (
    <div className="flex justify-center items-end h-32 md:h-48 w-full select-none relative bg-gray-900 p-2 md:p-4 rounded-t-xl shadow-2xl overflow-hidden">
      {notes.map((note) => {
        const isActive = activeNotes.has(note.frequency);
        const color = frequencyToHSL(note.frequency);
        
        const baseClass = "relative border border-gray-900 rounded-b-md transition-all duration-100 cursor-pointer z-10 touch-none";
        // White keys: flexible width to fill container
        const whiteClass = `h-full flex-1 min-w-[20px] bg-white text-black hover:bg-gray-100 active:scale-95 origin-top ${isActive ? '!bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : ''}`;
        // Black keys: absolute positioning or negative margins. 
        // With flex layout for white keys, negative margins on black keys works if they are inserted in flow.
        // But scaling them is tricky.
        // Let's stick to the current linear rendering but adjust sizing.
        const blackClass = `h-[60%] w-[6%] bg-black text-white -mx-[3%] z-20 hover:bg-gray-800 active:scale-95 origin-top ${isActive ? '!bg-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`;
        
        const isBlack = note.type === 'black';

        return (
          <div
            key={note.note + note.frequency}
            className={`${baseClass} ${isBlack ? blackClass : whiteClass}`}
            style={
              isBlack 
                ? { backgroundColor: isActive ? color : undefined }
                : { backgroundColor: isActive ? color : undefined }
            }
            onMouseDown={() => onPlay(note.frequency)}
            onMouseUp={() => onStop(note.frequency)}
            onMouseLeave={() => onStop(note.frequency)}
            onTouchStart={(e) => { e.preventDefault(); onPlay(note.frequency); }}
            onTouchEnd={() => onStop(note.frequency)}
          >
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] md:text-xs opacity-50 font-mono pointer-events-none mix-blend-difference">
              {note.key.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
