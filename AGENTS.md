# Synthesthesia 🎨🎹

## Project Overview

Synthesthesia is an interactive audio-visual frequency mapper that explores the cross-modal relationship between sound and light. It allows users to visualize music through two distinct historical and theoretical frameworks:

1. **Newtonian Physics Model (1704)** - Based on Sir Isaac Newton's *Opticks*, using linear frequency mapping via octave transposition
2. **Harmonic Perceptual Model (2026)** - Based on Dr. Milton Mermikides' Gresham College Lecture, using Circle of Fifths and synesthetic anchors

The application features a virtual synthesizer keyboard (A-Z keys), real-time waveform visualization, chord detection, and the Bouba-Kiki timbre effect.

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.0 |
| Language | TypeScript 5.9.3 |
| Build Tool | Vite (rolldown-vite@7.2.5) |
| Styling | Tailwind CSS 4.1.18 |
| Animation | Framer Motion 12.29.2 |
| Audio | Web Audio API (Native) |
| Linting | ESLint 9 + typescript-eslint |

## Project Structure

```
synthesthesia/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles (Tailwind import)
│   ├── components/             # React UI components
│   │   ├── Keyboard.tsx        # Virtual piano keyboard
│   │   ├── Visualizer.tsx      # Background visualizer with waveform canvas
│   │   ├── Wheels.tsx          # Pitch bend control wheel
│   │   ├── NoteInfoCard.tsx    # Active note/chord display card
│   │   ├── ContextModal.tsx    # Theory explanation modal
│   │   ├── BoubaKikiTutorial.tsx  # Cross-modal correspondence tutorial
│   │   └── OctaveJourney.tsx   # "Slow light" visualization (unused)
│   ├── utils/                  # Utility modules
│   │   ├── audio.ts            # Web Audio API hook (useAudio)
│   │   ├── notes.ts            # Note definitions & keyboard mapping
│   │   ├── colors.ts           # Color-to-frequency mapping algorithms
│   │   └── chords.ts           # Chord detection algorithms
│   └── assets/                 # Static assets
├── public/                     # Public static files
│   ├── CNAME                   # Custom domain config (synthesthesia.mvicari.com)
│   └── vite.svg                # Vite logo
├── index.html                  # HTML entry point
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript root config (project references)
├── tsconfig.app.json           # TypeScript app config
├── tsconfig.node.json          # TypeScript node config
├── eslint.config.js            # ESLint flat config
├── tailwind.config.js          # Tailwind CSS config (minimal)
└── README.md                   # User-facing documentation
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **JSX**: react-jsx transform
- Key strict flags:
  - `noUnusedLocals: true` - Unused variables are errors
  - `noUnusedParameters: true` - Unused parameters are errors
  - `noFallthroughCasesInSwitch: true` - No implicit switch fallthrough
  - `verbatimModuleSyntax: true` - Explicit type imports required

### Naming Conventions
- React components: PascalCase (e.g., `Visualizer.tsx`)
- Utility functions: camelCase (e.g., `frequencyToRGB`)
- Types/Interfaces: PascalCase (e.g., `Note`, `VisualizerMode`)
- Constants: UPPER_SNAKE_CASE (e.g., `NOTES`, `LIGHT_VELOCITY`)

### Component Patterns
- Use functional components with hooks
- Custom hooks in `utils/` directory (e.g., `useAudio`)
- Props interfaces defined inline or imported
- Framer Motion `AnimatePresence` for exit animations

### Styling Conventions
- Tailwind CSS utility classes preferred
- Glassmorphism effects: `backdrop-blur`, `bg-white/5`, border opacity
- Custom CSS in `index.css` limited to global resets
- Responsive prefixes: `md:`, `sm:` for breakpoints

## Key Implementation Details

### Audio System (`src/utils/audio.ts`)
- Custom `useAudio` hook manages Web Audio API context
- Supports two waveforms: `sine` (smooth) and `sawtooth` (jagged)
- Pitch bend: ±2 semitones via `detune` parameter
- Envelope: 50ms attack, 150ms release
- iOS compatibility: silent buffer unlock on initialization

### Color Mapping (`src/utils/colors.ts`)
Two distinct algorithms:

1. **Physics Mode** (`frequencyToRGB`):
   - Scales audio frequency to visible light (384-768 THz)
   - Wavelength-to-RGB conversion
   - High-frequency washout toward white

2. **Harmonic Mode** (`getHarmonicColor`):
   - Scriabin hue anchors mapped to Circle of Fifths
   - Pitch-to-desaturation: higher frequencies = less saturated
   - HSL color space

### Note Mapping (`src/utils/notes.ts`)
- D Dorian scale (C to E, 1.5 octaves)
- Physical keyboard keys A-Z mapped to notes
- A4 = 440Hz reference

### Chord Detection (`src/utils/chords.ts`)
Detects: triads (Major, Minor, Dim, Aug, Sus2, Sus4), 7th chords, power chords, and Scriabin's "Mystic Chord"

## Keyboard Controls

| Key | Action |
|-----|--------|
| A-Z | Play corresponding note |
| M | Toggle Physics/Harmonic mode |
| V | Toggle Sine/Sawtooth waveform |
| +/- or =/- | Pitch bend up/down |
| Mouse Wheel | Pitch bend (smooth) |
| Escape | Close modals |

## Deployment

- **Target**: Static site hosting
- **Domain**: synthesthesia.mvicari.com (configured in `public/CNAME`)
- **Base path**: `/` (root) - change to `/synthesthesia/` for GitHub Pages subpath
- Build output: `dist/` directory

## Dependencies Notes

- Uses `rolldown-vite@7.2.5` instead of standard Vite (via npm override)
- Tailwind CSS v4 with `@import "tailwindcss"` syntax
- React 19 with latest TypeScript types
- No testing framework currently configured

## External References

The codebase includes academic citations:
- Newton, I. (1704). *Opticks* - [Project Gutenberg](https://www.gutenberg.org/files/33504/33504-h/33504-h.htm)
- Mermikides, M. (2026). *Music of Light & Colour* - [Gresham College](https://www.gresham.ac.uk/watch-now/music-light-colour)
- Scriabin, A. (1910). *Prometheus: The Poem of Fire*
- Köhler, W. (1929). *Gestalt Psychology* (Bouba-Kiki effect)

## Security Considerations

- AudioContext requires user interaction to start (browser autoplay policy)
- No user input sanitization needed (no form inputs)
- External links use `rel="noopener noreferrer"`
- No sensitive data or API keys in codebase
