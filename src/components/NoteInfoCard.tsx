import React, { useRef, useEffect, useState } from 'react';
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
    analyser,
    waveform = 'sine',
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
            blendColor = allActiveFreqs.length > 1 ? getMixColor(allActiveFreqs) : frequencyToHSL(primaryFrequency);
        }
    }

    // Canvas & Animation Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const isSaw = waveform === 'sawtooth' || waveform === 'square';

    // Optimize Loop: Store render config in ref to avoid restarting loop
    const renderConfig = useRef({ blendColor, isSaw, waveform });
    useEffect(() => {
        renderConfig.current = { blendColor, isSaw, waveform };
    }, [blendColor, isSaw, waveform]);

    // Resize Observer to handle dynamic content size
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [hasActiveInput]);

    // Render Loop
    useEffect(() => {
        if (!analyser || !hasActiveInput) return;

        if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }

        let animationId: number;

        const update = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const dataArray = dataArrayRef.current;
            const { blendColor, isSaw, waveform } = renderConfig.current;

            if (canvas && ctx && dataArray && dimensions.width > 0) {
                analyser.getByteTimeDomainData(dataArray as any);

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / dataArray.length);

                // Setup Canvas
                const padding = 60; // Extra space for waveform excursion
                const dpr = window.devicePixelRatio || 1;
                const canvasWidth = dimensions.width + (padding * 2);
                const canvasHeight = dimensions.height + (padding * 2);

                // Only resize if necessary (to avoid clearing indiscriminately if size is stable)
                if (canvas.width !== canvasWidth * dpr || canvas.height !== canvasHeight * dpr) {
                    canvas.width = canvasWidth * dpr;
                    canvas.height = canvasHeight * dpr;
                    canvas.style.width = `${canvasWidth}px`;
                    canvas.style.height = `${canvasHeight}px`;
                    ctx.scale(dpr, dpr);
                } else {
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                }

                ctx.save();
                ctx.translate(padding, padding); // Move origin to top-left of the actual card box

                ctx.strokeStyle = blendColor;
                ctx.lineWidth = isSaw ? 2 : 3;
                ctx.lineCap = isSaw ? 'butt' : 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 15;
                ctx.shadowColor = blendColor;

                // Draw path
                ctx.beginPath();

                const w = dimensions.width;
                const h = dimensions.height;
                const r = 32; // border-radius: 2rem = 32px

                // Perimeter Geometry
                // We map t (0..1) to the total perimeter.
                // Segments: Top(w-2r), TR_Corner(0.5pi*r), Right(h-2r), BR_Corner, Bottom, BL_Corner, Left, TL_Corner.
                const straightX = Math.max(0, w - 2 * r);
                const straightY = Math.max(0, h - 2 * r);
                const cornerLen = 0.5 * Math.PI * r;
                const perimeter = (2 * straightX) + (2 * straightY) + (4 * cornerLen);

                const bufferLength = dataArray.length;
                const time = Date.now() / 1000;

                // Sawtooth Parameters
                const energy = Math.pow(rms, 0.7);
                const baseTeeth = waveform === 'square' ? 4 : 6;
                const dynamicTeeth = baseTeeth + Math.floor(energy * 24);
                const teeth = dynamicTeeth;
                const toothDepth = 20 + (energy * 60);
                const rotationSpeed = 0.5 + (energy * 2);
                const rotationOffset = time * rotationSpeed;
                const secondaryMod = Math.sin(time * 3) * 0.3 * energy;

                for (let i = 0; i <= bufferLength; i++) {
                    const t = i / bufferLength;
                    const d = t * perimeter;
                    const angle = t * Math.PI * 2 + rotationOffset; // Map t to 0-2PI for saw logic

                    // Determine position and normal on rounded rect
                    let x, y, nx, ny;

                    // We start at Top-Left, just after the corner (Top edge start) to match standard rect definition order?
                    // Let's start Top-Left straight section.
                    // Sequence: Top -> TR -> Right -> BR -> Bottom -> BL -> Left -> TL

                    let currD = 0;

                    // Top Edge
                    if (d < currD + straightX) {
                        const localD = d - currD;
                        x = r + localD;
                        y = 0;
                        nx = 0; ny = -1;
                    } else if ((currD += straightX) && d < currD + cornerLen) {
                        // TR Corner
                        const localD = d - currD;
                        const theta = (localD / cornerLen) * (Math.PI / 2); // 0 to 90 deg
                        // Center of corner arc is (w-r, r)
                        // Angle 0 is straight up (-90deg in standard math? No, local coords relative to center)
                        // At start of TR corner (top edge), normal is (0, -1). At end (right edge), normal is (1, 0).
                        // Standard circle: 0 is right, -PI/2 is up.
                        // We traverse -PI/2 to 0.
                        const arcAngle = -Math.PI / 2 + theta;
                        x = (w - r) + Math.cos(arcAngle) * r;
                        y = r + Math.sin(arcAngle) * r;
                        nx = Math.cos(arcAngle);
                        ny = Math.sin(arcAngle);
                    } else if ((currD += cornerLen) && d < currD + straightY) {
                        // Right Edge
                        const localD = d - currD;
                        x = w;
                        y = r + localD;
                        nx = 1; ny = 0;
                    } else if ((currD += straightY) && d < currD + cornerLen) {
                        // BR Corner
                        const localD = d - currD;
                        const theta = (localD / cornerLen) * (Math.PI / 2);
                        // Traverse 0 to PI/2
                        const arcAngle = theta;
                        x = (w - r) + Math.cos(arcAngle) * r;
                        y = (h - r) + Math.sin(arcAngle) * r;
                        nx = Math.cos(arcAngle);
                        ny = Math.sin(arcAngle);
                    } else if ((currD += cornerLen) && d < currD + straightX) {
                        // Bottom Edge
                        // Going Right to Left
                        const localD = d - currD;
                        x = (w - r) - localD;
                        y = h;
                        nx = 0; ny = 1;
                    } else if ((currD += straightX) && d < currD + cornerLen) {
                        // BL Corner
                        // Traverse PI/2 to PI
                        const localD = d - currD;
                        const theta = (localD / cornerLen) * (Math.PI / 2);
                        const arcAngle = Math.PI / 2 + theta;
                        x = r + Math.cos(arcAngle) * r;
                        y = (h - r) + Math.sin(arcAngle) * r;
                        nx = Math.cos(arcAngle);
                        ny = Math.sin(arcAngle);
                    } else if ((currD += cornerLen) && d < currD + straightY) {
                        // Left Edge
                        // Going Bottom to Top
                        const localD = d - currD;
                        x = 0;
                        y = (h - r) - localD;
                        nx = -1; ny = 0;
                    } else {
                        // TL Corner (remaining part)
                        // Traverse PI to 3PI/2 (or -PI/2)
                        const localD = d - (currD + straightY); // Note: currD was updated in if
                        const theta = (localD / cornerLen) * (Math.PI / 2);
                        const arcAngle = Math.PI + theta;
                        x = r + Math.cos(arcAngle) * r;
                        y = r + Math.sin(arcAngle) * r;
                        nx = Math.cos(arcAngle);
                        ny = Math.sin(arcAngle);
                    }

                    // Calculate Displacement using Audio Data
                    const idx = i % bufferLength;
                    const v = (dataArray[idx] - 128) / 128;

                    let displacement = 0;

                    if (!isSaw) {
                        // Sine Mode (Bouba) - smooth
                        displacement = v * 30 * (1 + rms * 2);
                    } else {
                        // Sawtooth Mode (Kiki) - spiky
                        const sawPhase = (angle * teeth) % (Math.PI * 2);
                        let sawValue;
                        const dutyCycle = waveform === 'square'
                            ? 0.3 + (energy * 0.4) + (secondaryMod * 0.2)
                            : 0.05 + (energy * 0.35) + (secondaryMod * 0.15);

                        if (sawPhase < Math.PI * 2 * dutyCycle) {
                            sawValue = Math.pow(sawPhase / (Math.PI * 2 * dutyCycle), 0.7) * 2 - 1;
                        } else {
                            sawValue = (Math.pow((Math.PI * 2 - sawPhase) / (Math.PI * 2 * (1 - dutyCycle)), 0.7)) * 2 - 1;
                        }

                        const tertiaryMod = Math.sin(angle * teeth * 3 + time * 5) * 5 * energy;
                        displacement = (v * 25) + (sawValue * toothDepth) + tertiaryMod;
                    }

                    // Apply displacement
                    // For corners, we push outward radially. For sides, we push outward normaal.
                    const px = x + nx * displacement;
                    const py = y + ny * displacement;

                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }

                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }

            animationId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationId);
    }, [analyser, hasActiveInput, dimensions]);

    return (
        <div className="absolute inset-x-0 top-[15%] flex flex-col items-center z-50 pointer-events-none">
            <AnimatePresence>
                {hasActiveInput && primaryFrequency > 0 && (
                    <motion.div
                        key="info-panel"
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative mb-4 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-3xl bg-black/40"
                        style={{
                            boxShadow: `0 0 60px -10px ${blendColor ? blendColor + '30' : 'rgba(0,0,0,0)'}`
                        }}
                    >
                        {/* Canvas Waveform Border */}
                        <canvas
                            ref={canvasRef}
                            className="absolute pointer-events-none"
                            style={{
                                left: '-60px',
                                top: '-60px',
                                // We don't need explicit width/height here as resizing manages the element attr
                            }}
                        />

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
