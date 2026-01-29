export interface Note {
  note: string;
  frequency: number;
  key: string; // The physical keyboard key
  type: 'white' | 'black';
}

// Starting from C3 (roughly)
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
