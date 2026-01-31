# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint on all .ts/.tsx files
npm run preview      # Preview production build locally
```

No test framework is configured. The build command (`npm run build`) runs `tsc -b` first, which validates TypeScript.

## Architecture Overview

Synthesthesia is a client-side React application that visualizes sound as color using two competing models:
- **Physics Mode**: Newton's 1704 linear frequency-to-wavelength mapping
- **Harmonic Mode**: Circle of Fifths mapped to Scriabin's synesthetic hues

### Data Flow

```
User Input (keyboard/mouse/touch)
    ↓
App.tsx (all state lives here)
    ├─→ useAudio hook → Web Audio API (oscillators, analyser)
    ├─→ Visualizer → Canvas waveform + Framer Motion background
    ├─→ Keyboard → Virtual piano (touch/click/drag)
    ├─→ NoteInfoCard → Note/chord display
    └─→ Wheels → Pitch bend control
```

### Key Modules

| File | Purpose |
|------|---------|
| `src/utils/audio.ts` | `useAudio` hook - oscillator management, pitch bend, iOS unlock |
| `src/utils/colors.ts` | Two algorithms: `frequencyToRGB` (physics) and `getHarmonicColor` (harmonic) |
| `src/utils/notes.ts` | Note definitions, D Dorian scale, A-Z keyboard mapping |
| `src/utils/chords.ts` | Interval pattern matching for chord detection |
| `src/components/Visualizer.tsx` | Canvas-based waveform + motion background (perf-critical) |

### State in App.tsx

- `activeNotes: Set<number>` - frequencies currently playing
- `pitchBend: number` - semitones offset (-2 to +2)
- `mode: 'physics' | 'harmonic'` - visualization algorithm
- `waveform: 'sine' | 'sawtooth'` - oscillator type

## Code Patterns

**Audio System**: Oscillator pooling via Map<frequency, OscillatorNode>. 50ms attack, 150ms release envelopes. iOS requires silent buffer unlock on first interaction.

**Visualizer Performance**: Uses refs for animation loop to avoid React re-renders. Asymmetric smoothing (fast attack 0.3, slow decay 0.05) for responsive feel.

**Color Mixing**: Physics mode uses RGB averaging. Harmonic mode uses circular hue averaging in HSL space.

## TypeScript Strictness

Strict mode enabled with:
- `noUnusedLocals` / `noUnusedParameters` - unused code is an error
- `verbatimModuleSyntax` - requires explicit `type` imports

## Keyboard Controls

| Key | Action |
|-----|--------|
| A-Z | Play notes |
| M | Toggle Physics/Harmonic mode |
| V | Toggle Sine/Sawtooth waveform |
| +/- | Pitch bend |
| Escape | Close modals |

## Deployment

Static site deployment to `synthesthesia.mvicari.com` (CNAME in `public/`). Build output goes to `dist/`.
