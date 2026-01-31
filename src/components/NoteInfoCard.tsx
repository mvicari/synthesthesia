import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { frequencyToHSL, getMixColor, getLightStats, getHarmonicColor, getHarmonicPitchInfo, getHarmonicMixColor, getNewton7BandColor, getNewton7BandMixColor, getNewton7BandInfo } from '../utils/colors';
import { NOTES } from '../utils/notes';
import { detectChord } from '../utils/chords';

export interface NoteInfoCardProps {
    activeNotes: Set<number>;
    pitchBend?: number;
    mode?: 'physics' | 'harmonic';
    physicsSubMode?: 'continuous' | '7band';
    analyser?: AnalyserNode | null;
    waveform?: OscillatorType;
}

export const NoteInfoCard: React.FC<NoteInfoCardProps> = ({
    activeNotes,
    pitchBend = 0,
    mode = 'physics',
    physicsSubMode = 'continuous',
}) => {
    // Helper to calculate bent frequency
    const getBentFreq = (baseFreq: number) => baseFreq * Math.pow(2, pitchBend / 12);

    // Determine Active Inputs
    const hasActiveInput = activeNotes.size > 0;

    // Determine Primary Frequency and All Active Frequencies
    let primaryFrequency = 0;
    const allActiveFreqs: number[] = [];

    if (hasActiveInput) {
        const freqs = Array.from(activeNotes).map(getBentFreq);
        primaryFrequency = freqs[0];
        allActiveFreqs.push(...freqs);
    }

    // Calculate Color based on Mode (Theory)
    let blendColor = 'transparent';
    if (primaryFrequency > 0) {
        if (mode === 'harmonic') {
            blendColor = allActiveFreqs.length > 1 ? getHarmonicMixColor(allActiveFreqs) : getHarmonicColor(primaryFrequency);
        } else if (physicsSubMode === '7band') {
            // Newton's discrete 7-band mode
            blendColor = allActiveFreqs.length > 1 ? getNewton7BandMixColor(allActiveFreqs) : getNewton7BandColor(primaryFrequency);
        } else {
            // Continuous spectrum mode
            if (allActiveFreqs.length > 1) {
                blendColor = getMixColor(allActiveFreqs);
            } else {
                blendColor = frequencyToHSL(primaryFrequency);
            }
        }
    }

    // Detect chord for display
    const detectedChord = allActiveFreqs.length > 1 ? detectChord(allActiveFreqs) : null;
    const isMysticChord = detectedChord?.quality === 'Mystic';

    return (
        <div className="absolute inset-x-0 top-[12%] md:top-[8%] flex flex-col items-center z-50 pointer-events-none px-2">
            <AnimatePresence>
                {hasActiveInput && primaryFrequency > 0 && (
                    // ...
                    <motion.div
                        key="info-panel"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`relative mb-2 md:mb-4 flex flex-col items-center justify-center rounded-xl md:rounded-[2rem] backdrop-blur-3xl max-w-[95vw] ${isMysticChord ? 'bg-gradient-to-br from-red-900/40 via-purple-900/40 to-violet-900/40' : 'bg-black/40'
                            }`}
                        style={{
                            boxShadow: isMysticChord
                                ? '0 0 80px -10px rgba(139, 92, 246, 0.5), 0 0 120px -20px rgba(220, 38, 38, 0.3)'
                                : `0 0 60px -10px ${blendColor ? blendColor + '30' : 'rgba(0,0,0,0)'}`
                        }}
                    >
                        {/* Content Container - needed for measuring size */}
                        <div className="p-4 md:p-8 flex flex-col items-center justify-center">

                            {/* Inner glow border for depth (static) */}
                            <div
                                className="absolute inset-0 rounded-xl md:rounded-[2rem] border pointer-events-none transition-colors duration-300"
                                style={{
                                    borderColor: blendColor ? blendColor + '15' : 'rgba(255,255,255,0.03)',
                                }}
                            />

                            {/* Color indicator / Orb - Hexagonal for Mystic Chord */}
                            {isMysticChord ? (
                                <div className="relative mb-3 md:mb-6">
                                    {/* Pulsing hexagonal glow for Mystic Chord (6 notes = 6 sides) */}
                                    <svg viewBox="0 0 100 100" className="w-14 h-14 md:w-20 md:h-20 animate-pulse">
                                        <defs>
                                            <linearGradient id="mysticGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#dc2626" />
                                                <stop offset="50%" stopColor="#7c3aed" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                        <polygon
                                            points="50,3 93,25 93,75 50,97 7,75 7,25"
                                            fill="url(#mysticGradient)"
                                            filter="drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))"
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <div
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-[0_0_40px_currentColor] animate-pulse mb-3 md:mb-6"
                                    style={{ backgroundColor: blendColor, color: blendColor }}
                                />
                            )}

                            {mode === 'harmonic' ? (
                                (() => {
                                    const pitchInfo = getHarmonicPitchInfo(primaryFrequency);
                                    const saturation = allActiveFreqs.length > 0
                                        ? Math.round(90 - (Math.min(1, Math.max(0, (primaryFrequency - 100) / 1900)) * 70))
                                        : 90;
                                    return (
                                        <>
                                            <span
                                                className="text-4xl md:text-8xl font-thin text-white tracking-tighter mb-1 md:mb-2 leading-none"
                                                style={{ textShadow: `0 0 40px ${blendColor}50` }}
                                            >
                                                {allActiveFreqs.length > 1 ? (
                                                    detectedChord ? (
                                                        isMysticChord ? (
                                                            <span className="text-2xl md:text-4xl bg-gradient-to-r from-red-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                                                                Mystic Chord
                                                            </span>
                                                        ) : (
                                                            <span className="text-3xl md:text-5xl">{detectedChord.name}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-3xl md:text-5xl">{allActiveFreqs.length}<span className="text-base md:text-xl ml-1 md:ml-2 opacity-50 font-normal tracking-normal">NOTES</span></span>
                                                    )
                                                ) : (
                                                    <>{pitchInfo.noteName}<span className="text-xl md:text-4xl text-white/50 align-top ml-1">{pitchInfo.octave}</span></>
                                                )}
                                            </span>
                                            {isMysticChord && (
                                                <span className="text-[10px] md:text-xs text-violet-300/80 mt-1 italic">
                                                    Scriabin's bridge from earthly to divine
                                                </span>
                                            )}
                                            <span className="text-xs md:text-lg font-mono text-white/70 text-center max-w-[90vw] md:max-w-xl truncate">
                                                {allActiveFreqs.length > 1
                                                    ? allActiveFreqs.sort((a, b) => a - b).map(f => f.toFixed(1)).join(' + ') + ' Hz'
                                                    : `${primaryFrequency.toFixed(1)} Hz`
                                                }
                                            </span>
                                            {allActiveFreqs.length === 1 && Math.abs(pitchInfo.cents) >= 1 && (
                                                <span className={`text-[10px] md:text-xs font-mono mt-1 ${Math.abs(pitchInfo.cents) < 10 ? 'text-green-400' :
                                                    Math.abs(pitchInfo.cents) < 25 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {pitchInfo.cents >= 0 ? '+' : ''}{pitchInfo.cents} cents
                                                </span>
                                            )}
                                            {/* Saturation Meter for Harmonic Mode */}
                                            <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-2">
                                                <span className="text-[7px] md:text-[8px] text-white/30 font-mono uppercase">Sat</span>
                                                <div className="w-16 md:w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                                                        style={{ width: `${saturation}%` }}
                                                    />
                                                </div>
                                                <span className="text-[7px] md:text-[8px] text-white/40 font-mono">{saturation}%</span>
                                            </div>
                                            {/* Octave Position Indicators */}
                                            <div className="mt-2 md:mt-3 flex items-center gap-0.5 md:gap-1">
                                                <span className="text-[6px] md:text-[7px] text-white/30 font-mono mr-0.5 md:mr-1">OCT</span>
                                                {[0, 1, 2, 3, 4, 5, 6, 7].map((oct) => (
                                                    <div
                                                        key={oct}
                                                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-200 ${pitchInfo.octave === oct
                                                            ? 'scale-125'
                                                            : 'bg-white/10'
                                                            }`}
                                                        style={{
                                                            backgroundColor: pitchInfo.octave === oct ? blendColor : undefined,
                                                            boxShadow: pitchInfo.octave === oct ? `0 0 8px ${blendColor}` : undefined
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="mt-2 text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/40 font-mono">
                                                <span className="hidden sm:inline">Harmonic • </span>Circle of Fifths
                                            </span>
                                        </>
                                    );
                                })()
                            ) : (
                                (() => {
                                    const baseFreq = Array.from(activeNotes)[0];
                                    // Find note based on ORIGINAL frequency, not bent frequency
                                    const note = NOTES.find(n => Math.abs(n.frequency - baseFreq) < 0.1);
                                    const { wavelengthNm, frequencyTHz, octaveShift } = getLightStats(primaryFrequency);
                                    const bandInfo = physicsSubMode === '7band' ? getNewton7BandInfo(primaryFrequency) : null;
                                    return (
                                        <>
                                            <span
                                                className="text-4xl md:text-8xl font-thin text-white tracking-tighter mb-1 md:mb-2 leading-none"
                                                style={{ textShadow: `0 0 40px ${blendColor}50` }}
                                            >
                                                {allActiveFreqs.length > 1 ? (
                                                    detectedChord ? (
                                                        isMysticChord ? (
                                                            <span className="text-2xl md:text-4xl bg-gradient-to-r from-red-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                                                                Mystic Chord
                                                            </span>
                                                        ) : (
                                                            <span className="text-3xl md:text-5xl">{detectedChord.name}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-3xl md:text-5xl">{allActiveFreqs.length}<span className="text-base md:text-xl ml-1 md:ml-2 opacity-50 font-normal tracking-normal">NOTES</span></span>
                                                    )
                                                ) : (note?.note || '?')}
                                            </span>
                                            {isMysticChord && (
                                                <span className="text-[10px] md:text-xs text-violet-300/80 mt-1 italic">
                                                    Scriabin's bridge from earthly to divine
                                                </span>
                                            )}
                                            {/* Newton 7-Band indicator */}
                                            {bandInfo && allActiveFreqs.length === 1 && (
                                                <span className="text-xs md:text-sm font-mono mt-1" style={{ color: bandInfo.color }}>
                                                    {bandInfo.bandName} Band
                                                </span>
                                            )}
                                            <span className="text-xs md:text-lg font-mono text-white/70 text-center max-w-[90vw] md:max-w-xl truncate">
                                                {allActiveFreqs.length > 1
                                                    ? allActiveFreqs.sort((a, b) => a - b).map(f => f.toFixed(1)).join(' + ') + ' Hz'
                                                    : physicsSubMode === '7band'
                                                        ? `${primaryFrequency.toFixed(1)} Hz → ${bandInfo?.noteName}`
                                                        : `${primaryFrequency.toFixed(1)} Hz → ${wavelengthNm} nm`
                                                }
                                            </span>
                                            <span className="text-[10px] md:text-xs font-mono text-white/50 mt-1">
                                                {allActiveFreqs.length > 1
                                                    ? physicsSubMode === '7band'
                                                        ? 'D Dorian Color Mixing'
                                                        : `Spectral Blending (↑${octaveShift} oct)`
                                                    : physicsSubMode === '7band'
                                                        ? `Newton's 7-Color`
                                                        : `${frequencyTHz.toFixed(1)} THz (↑${octaveShift} oct)`
                                                }
                                            </span>
                                            {/* Octave Journey Indicator for Physics Mode (continuous only) - hide on mobile */}
                                            {physicsSubMode === 'continuous' && (
                                                <div className="mt-2 md:mt-3 hidden sm:flex items-center gap-2">
                                                    <span className="text-[8px] text-white/30 font-mono uppercase">Octave Shift</span>
                                                    <span className="text-[10px] text-white/60 font-mono">↓{octaveShift} from visible light</span>
                                                </div>
                                            )}
                                            {/* Octave Position Indicators */}
                                            {(() => {
                                                // Calculate octave from MIDI note
                                                const midiNote = 12 * Math.log2(primaryFrequency / 440) + 69;
                                                const currentOctave = Math.floor(Math.round(midiNote) / 12) - 1;
                                                return (
                                                    <div className="mt-2 md:mt-3 flex items-center gap-0.5 md:gap-1">
                                                        <span className="text-[6px] md:text-[7px] text-white/30 font-mono mr-0.5 md:mr-1">OCT</span>
                                                        {[0, 1, 2, 3, 4, 5, 6, 7].map((oct) => (
                                                            <div
                                                                key={oct}
                                                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-200 ${currentOctave === oct
                                                                    ? 'scale-125'
                                                                    : 'bg-white/10'
                                                                    }`}
                                                                style={{
                                                                    backgroundColor: currentOctave === oct ? blendColor : undefined,
                                                                    boxShadow: currentOctave === oct ? `0 0 8px ${blendColor}` : undefined
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                            <span className="mt-2 text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/40 font-mono">
                                                {physicsSubMode === '7band'
                                                    ? '7-Band • Newton 1704'
                                                    : 'Spectrum • Newton 1704'
                                                }
                                            </span>
                                        </>
                                    );
                                })()
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
