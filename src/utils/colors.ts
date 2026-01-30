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
  // λ = v / f
  const wavelength = (LIGHT_VELOCITY / targetFreq) * 1e9;
  const [r, g, b] = wavelengthToRgb(wavelength);
  return `rgb(${r}, ${g}, ${b})`;
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
 * Scriabin/Mermikides Lookup Table (LUT) for Circle of Fifths
 * Index 0 corresponds to C (Red), moving by Perfect Fifths.
 */
const SCRIABIN_HUES = [0, 30, 60, 120, 210, 260, 285, 315, 330, 340, 350, 355];

/**
 * Milton Mermikides' Harmonic Color Mapping using Circle of Fifths
 * 
 * This maps musical pitch to color based on harmonic relationships rather than
 * the linear physics approach (octave doubling).
 * 
 * By multiplying the pitch class by 7 (the interval of a Perfect Fifth),
 * harmonically related notes (like C & G) become visually adjacent neighbors
 * on the color wheel.
 * 
 * Logic Check:
 * - Note A (PC 9) -> Index (9*7)%12 = 3 -> 120° (Green)
 * - Note E (PC 4) -> Index (4*7)%12 = 4 -> 210° (Blue)
 * - Note F# (PC 6) -> Index (6*7)%12 = 6 -> 285° (Violet)
 */
export const getHarmonicColor = (frequency: number, saturation: number = 85, lightness: number = 55): string => {
  if (frequency <= 0) return 'hsl(0, 0%, 0%)';

  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const pitchClass = Math.round(midiNote) % 12;

  // Map to Circle of Fifths index
  const circleIndex = (pitchClass * 7) % 12;
  const hue = SCRIABIN_HUES[circleIndex];

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

  // Average the hues on the color wheel (need to handle circular averaging)
  let sinSum = 0;
  let cosSum = 0;

  frequencies.forEach(freq => {
    const hsl = getHarmonicColor(freq);
    const hueMatch = hsl.match(/hsl\((\d+)/);
    const hue = hueMatch ? parseFloat(hueMatch[1]) : 0;
    const radians = (hue * Math.PI) / 180;
    sinSum += Math.sin(radians);
    cosSum += Math.cos(radians);
  });

  const avgHue = ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360;

  return `hsl(${Math.round(avgHue)}, 85%, 55%)`;
};
