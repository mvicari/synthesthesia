/**
 * Color-to-Frequency Mapping Utilities
 * 
 * Implements two competing worldviews on the relationship between sound and light:
 * 
 * 1. NEWTONIAN PHYSICS MODEL (1704)
 *    Based on Sir Isaac Newton's Opticks (Book I, Proposition VI)
 *    - Maps D Dorian scale to visible spectrum via octave transposition
 *    - Light spans ~1 octave; transposed down 41 octaves becomes audible
 *    - Linear frequency mapping: Low pitch = Red, High pitch = Violet
 *    @see https://www.gutenberg.org/files/33504/33504-h/33504-h.htm
 * 
 * 2. HARMONIC PERCEPTUAL MODEL (2026)
 *    Based on Dr. Milton Mermikides' Gresham College Lecture
 *    - Uses Circle of Fifths and synesthetic anchors (Scriabin)
 *    - C = Red (human/earthly), D = Golden-yellow (transformation), F# = Blue-violet (transcendent)
 *    - Higher octaves desaturate toward white (perceptual response)
 *    @see https://www.gresham.ac.uk/watch-now/music-light-colour
 * 
 * "This secret analogy between light and sound leads one to suspect that all things 
 *  in nature have their hidden rapports, which perhaps some day will be discovered." 
 *  — Voltaire, Éléments de la philosophie de Newton (1738)
 */

// Physics constants
const LIGHT_VELOCITY = 299792458; // m/s
// Visible spectrum boundaries in Frequency (THz)
// Red end (~780nm) is approx 384 THz
// Violet end (~390nm) is approx 769 THz
const MIN_VISIBLE_FREQ = 384e12;
const MAX_VISIBLE_FREQ = 768e12; // Exactly one octave up for clean wrapping

// Helper: Scale Audio Hz to Light THz
const scaleToVisible = (frequency: number): number => {
  let targetFreq = frequency;
  if (targetFreq <= 0) return 0;
  while (targetFreq < MIN_VISIBLE_FREQ) targetFreq *= 2;
  while (targetFreq > MAX_VISIBLE_FREQ) targetFreq /= 2;
  return targetFreq;
};

// Helper: Convert Wavelength (nm) to RGB
// Based on brute-force spectral approximation
const wavelengthToRgb = (wavelength: number): [number, number, number] => {
  let r = 0, g = 0, b = 0;
  let alpha = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity fall-off near vision limits
  if (wavelength > 700) {
    alpha = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else if (wavelength < 420) {
    alpha = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else {
    alpha = 1;
  }

  // Apply gamma correction and intensity
  const adjust = (color: number, factor: number) => Math.round(255 * Math.pow(color * factor, 0.8));

  return [adjust(r, alpha), adjust(g, alpha), adjust(b, alpha)];
};

export const getLightStats = (frequency: number) => {
  const targetFreq = scaleToVisible(frequency);
  const wavelength = (LIGHT_VELOCITY / targetFreq) * 1e9;
  // Calculate how many octaves we traveled (log2 of the ratio)
  const octaveShift = Math.round(Math.log2(targetFreq / frequency));

  return {
    frequencyTHz: targetFreq / 1e12,
    wavelengthNm: Math.round(wavelength),
    octaveShift
  };
};

export const frequencyToRGB = (frequency: number): string => {
  const targetFreq = scaleToVisible(frequency);
  const wavelength = (LIGHT_VELOCITY / targetFreq) * 1e9;
  const [r, g, b] = wavelengthToRgb(wavelength);

  // Saturation Logic for Physics Mode
  // High frequencies (above ~600 THz) shift toward white
  const freqTHz = targetFreq / 1e12;
  const washOut = Math.min(1, Math.max(0, (freqTHz - 600) / 150));

  const rFinal = Math.round(r + (255 - r) * washOut);
  const gFinal = Math.round(g + (255 - g) * washOut);
  const bFinal = Math.round(b + (255 - b) * washOut);

  return `rgb(${rFinal}, ${gFinal}, ${bFinal})`;
};

// Kept for compatibility but forwarding to new logic
export const frequencyToHSL = (frequency: number): string => {
  return frequencyToRGB(frequency);
};

export const frequencyToGlow = (frequency: number): string => {
  const rgb = frequencyToRGB(frequency);
  // Extract numbers to add alpha
  const match = rgb.match(/\d+/g);
  if (!match) return 'rgba(0,0,0,0.8)';
  return `rgba(${match[0]}, ${match[1]}, ${match[2]}, 0.8)`;
};

export const getMixColor = (frequencies: number[]): string => {
  if (frequencies.length === 0) return 'transparent';
  if (frequencies.length === 1) return frequencyToRGB(frequencies[0]);

  let rTotal = 0, gTotal = 0, bTotal = 0;

  frequencies.forEach(freq => {
    // We parse the RGB string coming back from the main function
    const rgbStr = frequencyToRGB(freq);
    const [r, g, b] = rgbStr.match(/\d+/g)?.map(Number) || [0, 0, 0];
    rTotal += r;
    gTotal += g;
    bTotal += b;
  });

  const rAvg = Math.round(rTotal / frequencies.length);
  const gAvg = Math.round(gTotal / frequencies.length);
  const bAvg = Math.round(bTotal / frequencies.length);

  return `rgb(${rAvg}, ${gAvg}, ${bAvg})`;
};

/**
 * Newton's Discrete 7-Band Color Mapping
 *
 * Newton explicitly forced the rainbow into 7 colors to match the 7 notes
 * of the D Dorian scale. This function maps any frequency to one of
 * Newton's 7 discrete color bands based on the nearest D Dorian note.
 *
 * D Dorian scale: D, E, F, G, A, B, C
 * Newton's mapping: D=Red, E=Orange, F=Yellow, G=Green, A=Blue, B=Indigo, C=Violet
 */
const NEWTON_BANDS: Record<string, { color: string; name: string }> = {
  D: { color: 'rgb(220, 38, 38)', name: 'Red' },      // red-600
  E: { color: 'rgb(249, 115, 22)', name: 'Orange' },  // orange-500
  F: { color: 'rgb(250, 204, 21)', name: 'Yellow' },  // yellow-400
  G: { color: 'rgb(34, 197, 94)', name: 'Green' },    // green-500
  A: { color: 'rgb(37, 99, 235)', name: 'Blue' },     // blue-600
  B: { color: 'rgb(67, 56, 202)', name: 'Indigo' },   // indigo-700
  C: { color: 'rgb(139, 92, 246)', name: 'Violet' },  // violet-500
};

// D Dorian pitch classes: D=2, E=4, F=5, G=7, A=9, B=11, C=0
const DORIAN_PITCH_CLASSES = [2, 4, 5, 7, 9, 11, 0];
const DORIAN_NOTES = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];

/**
 * Get Newton's discrete 7-band color for a frequency
 * Maps to nearest D Dorian note, then returns Newton's assigned color
 */
export const getNewton7BandColor = (frequency: number): string => {
  if (frequency <= 0) return 'rgb(0, 0, 0)';

  // Convert to pitch class (0-11)
  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const pitchClass = ((Math.round(midiNote) % 12) + 12) % 12;

  // Find nearest D Dorian pitch class
  let minDistance = 12;
  let nearestIndex = 0;

  for (let i = 0; i < DORIAN_PITCH_CLASSES.length; i++) {
    const pc = DORIAN_PITCH_CLASSES[i];
    // Calculate circular distance (e.g., C# to D is 1, not 11)
    const dist = Math.min(
      Math.abs(pitchClass - pc),
      12 - Math.abs(pitchClass - pc)
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = i;
    }
  }

  const noteName = DORIAN_NOTES[nearestIndex];
  return NEWTON_BANDS[noteName].color;
};

/**
 * Get Newton's 7-band info for display
 */
export const getNewton7BandInfo = (frequency: number): { noteName: string; bandName: string; color: string } => {
  if (frequency <= 0) return { noteName: '-', bandName: '-', color: 'rgb(0, 0, 0)' };

  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const pitchClass = ((Math.round(midiNote) % 12) + 12) % 12;

  let minDistance = 12;
  let nearestIndex = 0;

  for (let i = 0; i < DORIAN_PITCH_CLASSES.length; i++) {
    const pc = DORIAN_PITCH_CLASSES[i];
    const dist = Math.min(
      Math.abs(pitchClass - pc),
      12 - Math.abs(pitchClass - pc)
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = i;
    }
  }

  const noteName = DORIAN_NOTES[nearestIndex];
  const band = NEWTON_BANDS[noteName];
  return { noteName, bandName: band.name, color: band.color };
};

/**
 * Get mixed color for Newton's 7-band mode
 */
export const getNewton7BandMixColor = (frequencies: number[]): string => {
  if (frequencies.length === 0) return 'transparent';
  if (frequencies.length === 1) return getNewton7BandColor(frequencies[0]);

  let rTotal = 0, gTotal = 0, bTotal = 0;

  frequencies.forEach(freq => {
    const rgbStr = getNewton7BandColor(freq);
    const [r, g, b] = rgbStr.match(/\d+/g)?.map(Number) || [0, 0, 0];
    rTotal += r;
    gTotal += g;
    bTotal += b;
  });

  const rAvg = Math.round(rTotal / frequencies.length);
  const gAvg = Math.round(gTotal / frequencies.length);
  const bAvg = Math.round(bTotal / frequencies.length);

  return `rgb(${rAvg}, ${gAvg}, ${bAvg})`;
};

/**
 * Scriabin/Mermikides Lookup Table (LUT) for Circle of Fifths
 *
 * Maps pitch classes to hues based on historical synesthetic anchors and the Circle of Fifths.
 * Research by Itoh et al. (2017) found remarkable consistency across synaesthetes:
 * - Cs are consistently perceived as RED
 * - Ds lean toward GOLDEN-YELLOW
 * - Gs are associated with BLUE
 * - Fs tend toward GREEN
 *
 * Scriabin's specific anchors (used in Prometheus: The Poem of Fire, 1910):
 * - C = Red (0°) — the human, earthly point of origin
 * - D = Golden-yellow (60°) — transformation
 * - F# = Blue-violet (270°) — the transcendent and divine
 *
 * The array is indexed by Circle of Fifths position:
 * C(0)=0°, G(1)=30°, D(2)=60°, A(3)=90°, E(4)=120°, B(5)=150°,
 * F#(6)=270°, C#(7)=300°, G#(8)=330°, D#(9)=180°, A#(10)=240°, F(11)=210°
 *
 * Each pitch class now has a unique hue value.
 *
 * @see https://www.gresham.ac.uk/watch-now/music-light-colour
 * @see Itoh, K., Sakata, H., & Kashino, M. (2017). Scientific Reports, 7(1), 17781
 */
const SCRIABIN_HUES = [0, 30, 60, 90, 120, 150, 270, 300, 330, 180, 240, 210];

/**
 * Milton Mermikides' Harmonic Color Mapping using Circle of Fifths
 * 
 * Maps musical pitch to color based on historical synesthetic anchors (Scriabin).
 * Includes "Pitch-to-Desaturation" logic: Higher frequencies reduce saturation.
 */
export const getHarmonicColor = (frequency: number): string => {
  if (frequency <= 0) return 'hsl(0, 0%, 0%)';

  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const pitchClass = ((Math.round(midiNote) % 12) + 12) % 12;

  // Map to Circle of Fifths index
  const circleIndex = (pitchClass * 7) % 12;
  const hue = SCRIABIN_HUES[circleIndex];

  // Dynamic Saturation: Higher pitches become "whiter" or "cooler"
  // Base 100Hz - 90% sat, 2000Hz - 20% sat
  const satProgress = Math.min(1, Math.max(0, (frequency - 100) / 1900));
  const saturation = 90 - (satProgress * 70);
  const lightness = 55 + (satProgress * 20);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Get detailed pitch information for display (harmonic mode)
 */
export const getHarmonicPitchInfo = (frequency: number) => {
  if (frequency <= 0) {
    return { noteName: '-', octave: 0, cents: 0, pitchClass: 0 };
  }

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Convert to MIDI note
  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const roundedNote = Math.round(midiNote);

  // Get pitch class and octave
  const pitchClass = ((roundedNote % 12) + 12) % 12; // Ensure positive
  const octave = Math.floor(roundedNote / 12) - 1;

  // Calculate cents deviation from perfect pitch
  const cents = Math.round((midiNote - roundedNote) * 100);

  return {
    noteName: noteNames[pitchClass],
    octave,
    cents,
    pitchClass,
  };
};

/**
 * Get harmonic blend color for multiple frequencies
 */
export const getHarmonicMixColor = (frequencies: number[]): string => {
  if (frequencies.length === 0) return 'transparent';
  if (frequencies.length === 1) return getHarmonicColor(frequencies[0]);

  // Average the hues, saturation, and lightness
  let sinSum = 0;
  let cosSum = 0;
  let satSum = 0;
  let lightSum = 0;

  frequencies.forEach(freq => {
    const hsl = getHarmonicColor(freq);
    const [h, s, l] = hsl.match(/\d+/g)?.map(Number) || [0, 0, 0];
    
    const radians = (h * Math.PI) / 180;
    sinSum += Math.sin(radians);
    cosSum += Math.cos(radians);
    satSum += s;
    lightSum += l;
  });

  const avgHue = ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360;
  const avgSat = Math.round(satSum / frequencies.length);
  const avgLight = Math.round(lightSum / frequencies.length);

  return `hsl(${Math.round(avgHue)}, ${avgSat}%, ${avgLight}%)`;
};
