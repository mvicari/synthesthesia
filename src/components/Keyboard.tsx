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
    <div className="flex justify-center items-end h-32 md:h-44 w-full select-none relative overflow-visible">
      {notes.map((note) => {
        const isActive = activeNotes.has(note.frequency);
        const color = frequencyToHSL(note.frequency);
        
        const baseClass = "relative border border-black/20 rounded-b-lg transition-all duration-100 cursor-pointer z-10 touch-none shrink-0";
        // White keys: in-between width (w-10 md, w-7 mobile)
        const whiteClass = `h-full w-7 md:w-10 bg-white/90 backdrop-blur-sm text-black hover:bg-white active:scale-95 origin-top shadow-lg ${isActive ? '!bg-gray-200' : ''}`;
        // Black keys: refined width and negative margin for the new scale
        const blackClass = `h-[60%] w-5 md:w-7 bg-zinc-900 text-white -mx-[10px] md:-mx-[14px] z-20 hover:bg-black active:scale-95 origin-top shadow-xl ${isActive ? '!bg-zinc-700' : ''}`;
        
        const isBlack = note.type === 'black';

        return (
          <div
            key={note.note + note.frequency}
            className={`${baseClass} ${isBlack ? blackClass : whiteClass}`}
            style={{ backgroundColor: isActive ? color : undefined }}
            onMouseDown={() => onPlay(note.frequency)}
            onMouseUp={() => onStop(note.frequency)}
            onMouseLeave={() => onStop(note.frequency)}
            onTouchStart={(e) => { e.preventDefault(); onPlay(note.frequency); }}
            onTouchEnd={() => onStop(note.frequency)}
          >
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] opacity-30 font-mono pointer-events-none mix-blend-difference">
              {note.key.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
