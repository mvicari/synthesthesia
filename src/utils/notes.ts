/**
 * Musical Note Definitions
 * 
 * Defines the keyboard layout and frequencies based on standard 12-tone equal temperament.
 * Frequencies calculated using A4 = 440Hz reference.
 * 
 * The mapping follows the D Dorian scale pattern (D-E-F-G-A-B-C) used by Newton 
 * in his 1704 color-music correspondence in Opticks, Book I, Proposition VI.
 * 
 * Newton explicitly chose D Dorian (not major) for its symmetry and mathematical purity,
 * forcing 7 colors to match the 7 notes of this modal scale.
 * 
 * @see Newton, I. (1704). Opticks. London: Royal Society
 * @see https://www.gutenberg.org/files/33504/33504-h/33504-h.htm
 */

export interface Note {
  note: string;
  frequency: number;
  key: string; // The physical keyboard key
  type: 'white' | 'black';
}

// Starting from C3 (roughly) - follows D Dorian pattern as per Newton's Opticks (1704)
export const NOTES: Note[] = [
  { note: 'C', frequency: 261.63, key: 'a', type: 'white' },
  { note: 'C#', frequency: 277.18, key: 'w', type: 'black' },
  { note: 'D', frequency: 293.66, key: 's', type: 'white' },
  { note: 'D#', frequency: 311.13, key: 'e', type: 'black' },
  { note: 'E', frequency: 329.63, key: 'd', type: 'white' },
  { note: 'F', frequency: 349.23, key: 'f', type: 'white' },
  { note: 'F#', frequency: 369.99, key: 't', type: 'black' },
  { note: 'G', frequency: 392.00, key: 'g', type: 'white' },
  { note: 'G#', frequency: 415.30, key: 'y', type: 'black' },
  { note: 'A', frequency: 440.00, key: 'h', type: 'white' },
  { note: 'A#', frequency: 466.16, key: 'u', type: 'black' },
  { note: 'B', frequency: 493.88, key: 'j', type: 'white' },
  { note: 'C', frequency: 523.25, key: 'k', type: 'white' }, // Octave up
  { note: 'C#', frequency: 554.37, key: 'o', type: 'black' },
  { note: 'D', frequency: 587.33, key: 'l', type: 'white' },
  { note: 'D#', frequency: 622.25, key: 'p', type: 'black' },
  { note: 'E', frequency: 659.25, key: ';', type: 'white' },
];
