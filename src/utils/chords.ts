
export interface ChordResult {
    root: string;
    quality: string;
    name: string;
}

// Map frequency to Pitch Class (0 = C, 1 = C#, ... 11 = B)
const getPitchClass = (frequency: number): number => {
    // Simple lookup in NOTES array based on minimal distance
    // Since our keyboard is fixed, exact match is likely, but pitch bend exists.
    // We should un-bend first? Or just find nearest static note.
    // Let's rely on finding nearest note in the predefined list for now.
    // BUT the list only covers 1.5 octaves.
    // Formula: MIDI Note = 69 + 12 * log2(f / 440)
    // C4 (Middle C) is MIDI 60.
    const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
    return midi % 12; // 0..11
};

const pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const detectChord = (frequencies: number[]): ChordResult | null => {
    if (frequencies.length < 2) return null;

    // 1. Get unique pitch classes (sorted)
    const pcs = Array.from(new Set(frequencies.map(getPitchClass))).sort((a, b) => a - b);

    // We need to try each note as the potential ROOT to see if intervals match a chord
    // (Inversions handling)

    for (let i = 0; i < pcs.length; i++) {
        // Rotate array so pcs[i] is at index 0 (Root candidate)
        // Actually simpler: Create a normalized interval set for this rotation
        const root = pcs[i];
        const intervals = pcs.map(pc => (pc - root + 12) % 12).sort((a, b) => a - b);

        // Check signatures
        const signature = intervals.join(',');
        const rootName = pitchNames[root];

        // Dyads (2 notes) - implied chords
        if (frequencies.length === 2) {
            if (signature === '0,7') return { root: rootName, quality: '5', name: `${rootName}5 (Power)` };
            if (signature === '0,4') return { root: rootName, quality: 'Maj', name: `${rootName} Major` }; // Implied
            if (signature === '0,3') return { root: rootName, quality: 'Min', name: `${rootName} Minor` }; // Implied
        }

        // Triads (3 notes)
        if (signature === '0,4,7') return { root: rootName, quality: 'Maj', name: `${rootName} Major` };
        if (signature === '0,3,7') return { root: rootName, quality: 'Min', name: `${rootName} Minor` };
        if (signature === '0,3,6') return { root: rootName, quality: 'Dim', name: `${rootName} Dim` };
        if (signature === '0,4,8') return { root: rootName, quality: 'Aug', name: `${rootName} Aug` };
        if (signature === '0,5,7') return { root: rootName, quality: 'Sus4', name: `${rootName} Sus4` };
        if (signature === '0,2,7') return { root: rootName, quality: 'Sus2', name: `${rootName} Sus2` };

        // Tetrads (4 notes / 7ths)
        if (signature === '0,4,7,11') return { root: rootName, quality: 'Maj7', name: `${rootName} Maj7` };
        if (signature === '0,3,7,10') return { root: rootName, quality: 'Min7', name: `${rootName} Min7` };
        if (signature === '0,4,7,10') return { root: rootName, quality: 'Dom7', name: `${rootName}7` };
        if (signature === '0,3,6,9') return { root: rootName, quality: 'Dim7', name: `${rootName} Dim7` };
        if (signature === '0,3,7,11') return { root: rootName, quality: 'MinMaj7', name: `${rootName} MinMaj7` };
    }

    return null;
};
