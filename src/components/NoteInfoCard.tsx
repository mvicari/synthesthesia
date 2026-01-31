import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { frequencyToHSL, getMixColor, getLightStats, getHarmonicColor, getHarmonicPitchInfo, getHarmonicMixColor } from '../utils/colors';
import { NOTES } from '../utils/notes';
import { detectChord } from '../utils/chords';

export interface NoteInfoCardProps {
    activeNotes: Set<number>;
    pitchBend?: number;
    mode?: 'physics' | 'harmonic';
    analyser?: AnalyserNode | null;
    waveform?: OscillatorType;
}

export const NoteInfoCard: React.FC<NoteInfoCardProps> = ({
    activeNotes,
    pitchBend = 0,
    mode = 'physics',
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
        } else {
            if (allActiveFreqs.length > 1) {
                blendColor = getMixColor(allActiveFreqs);
            } else {
                blendColor = frequencyToHSL(primaryFrequency);
            }
        }
    }

    return (
        <div className="absolute inset-x-0 top-[15%] flex flex-col items-center z-50 pointer-events-none">
            <AnimatePresence>
                {hasActiveInput && primaryFrequency > 0 && (
                    // ...
                    <motion.div
                        key="info-panel"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative mb-4 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-3xl bg-black/40"
                        style={{
                            boxShadow: `0 0 60px -10px ${blendColor ? blendColor + '30' : 'rgba(0,0,0,0)'}`
                        }}
                    >
                        {/* Content Container - needed for measuring size */}
                        <div className="p-8 flex flex-col items-center justify-center">

                            {/* Inner glow border for depth (static) */}
                            <div
                                className="absolute inset-0 rounded-[2rem] border pointer-events-none transition-colors duration-300"
                                style={{
                                    borderColor: blendColor ? blendColor + '20' : 'rgba(255,255,255,0.05)',
                                }}
                            />

                            {/* Color indicator / Orb */}
                            <div
                                className="w-16 h-16 rounded-full shadow-[0_0_40px_currentColor] animate-pulse mb-6"
                                style={{ backgroundColor: blendColor, color: blendColor }}
                            />

                            {mode === 'harmonic' ? (
                                (() => {
                                    const pitchInfo = getHarmonicPitchInfo(primaryFrequency);
                                    const saturation = allActiveFreqs.length > 0
                                        ? Math.round(90 - (Math.min(1, Math.max(0, (primaryFrequency - 100) / 1900)) * 70))
                                        : 90;
                                    return (
                                        <>
                                            <span
                                                className="text-6xl md:text-8xl font-thin text-white tracking-tighter mb-2 leading-none"
                                                style={{ textShadow: `0 0 40px ${blendColor}50` }}
                                            >
                                                {allActiveFreqs.length > 1 ? (
                                                    detectChord(allActiveFreqs) ? (
                                                        <span className="text-4xl md:text-5xl">{detectChord(allActiveFreqs)?.name}</span>
                                                    ) : (
                                                        <span className="text-4xl md:text-5xl">{allActiveFreqs.length}<span className="text-xl ml-2 opacity-50 font-normal tracking-normal">NOTES</span></span>
                                                    )
                                                ) : (
                                                    <>{pitchInfo.noteName}<span className="text-2xl md:text-4xl text-white/50 align-top ml-1">{pitchInfo.octave}</span></>
                                                )}
                                            </span>
                                            <span className="text-sm md:text-lg font-mono text-white/70 text-center max-w-xs md:max-w-xl">
                                                {allActiveFreqs.length > 1
                                                    ? allActiveFreqs.sort((a, b) => a - b).map(f => f.toFixed(1)).join(' + ') + ' Hz'
                                                    : `${primaryFrequency.toFixed(1)} Hz`
                                                }
                                            </span>
                                            {allActiveFreqs.length === 1 && Math.abs(pitchInfo.cents) >= 1 && (
                                                <span className={`text-xs font-mono mt-1 ${Math.abs(pitchInfo.cents) < 10 ? 'text-green-400' :
                                                    Math.abs(pitchInfo.cents) < 25 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {pitchInfo.cents >= 0 ? '+' : ''}{pitchInfo.cents} cents
                                                </span>
                                            )}
                                            {/* Saturation Meter for Harmonic Mode */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[8px] text-white/30 font-mono uppercase">Saturation</span>
                                                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                                                        style={{ width: `${saturation}%` }}
                                                    />
                                                </div>
                                                <span className="text-[8px] text-white/40 font-mono">{saturation}%</span>
                                            </div>
                                            <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
                                                Harmonic • Circle of Fifths • Mermikides 2026
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
                                    return (
                                        <>
                                            <span
                                                className="text-6xl md:text-8xl font-thin text-white tracking-tighter mb-2 leading-none"
                                                style={{ textShadow: `0 0 40px ${blendColor}50` }}
                                            >
                                                {allActiveFreqs.length > 1 ? (
                                                    detectChord(allActiveFreqs) ? (
                                                        <span className="text-4xl md:text-5xl">{detectChord(allActiveFreqs)?.name}</span>
                                                    ) : (
                                                        <span className="text-4xl md:text-5xl">{allActiveFreqs.length}<span className="text-xl ml-2 opacity-50 font-normal tracking-normal">NOTES</span></span>
                                                    )
                                                ) : (note?.note || '?')}
                                            </span>
                                            <span className="text-sm md:text-lg font-mono text-white/70 text-center max-w-xs md:max-w-xl">
                                                {allActiveFreqs.length > 1
                                                    ? allActiveFreqs.sort((a, b) => a - b).map(f => f.toFixed(1)).join(' + ') + ' Hz'
                                                    : `${primaryFrequency.toFixed(1)} Hz → ${wavelengthNm} nm`
                                                }
                                            </span>
                                            <span className="text-xs font-mono text-white/50 mt-1">
                                                {allActiveFreqs.length > 1
                                                    ? `Additive Spectral Blending (↑${octaveShift} octaves)`
                                                    : `${frequencyTHz.toFixed(1)} THz (↑${octaveShift} octaves)`
                                                }
                                            </span>
                                            {/* Octave Journey Indicator for Physics Mode */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[8px] text-white/30 font-mono uppercase">Octave Shift</span>
                                                <span className="text-[10px] text-white/60 font-mono">↓{octaveShift} octaves from visible light</span>
                                            </div>
                                            <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
                                                F# to F Spectral Octave • Dorian Scale • Newton 1704
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
