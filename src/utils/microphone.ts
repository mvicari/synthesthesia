import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Autocorrelation-based pitch detection
 * Compares the signal buffer against itself to find the period offset with the highest correlation
 */
const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;

    // Not enough data
    if (SIZE < 2) return -1;

    // Get RMS to determine if there's enough signal
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);

    // Not enough signal
    if (rms < 0.01) return -1;

    // Trim buffer to find a zero-crossing start for cleaner correlation
    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < threshold) {
            r1 = i;
            break;
        }
    }

    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < threshold) {
            r2 = SIZE - i;
            break;
        }
    }

    const bufferCopy = buffer.slice(r1, r2);
    const trimmedSize = bufferCopy.length;

    // Autocorrelation
    const c = new Float32Array(trimmedSize);
    for (let i = 0; i < trimmedSize; i++) {
        for (let j = 0; j < trimmedSize - i; j++) {
            c[i] += bufferCopy[j] * bufferCopy[j + i];
        }
    }

    // Find the first peak after the initial decay
    let d = 0;
    while (c[d] > c[d + 1] && d < trimmedSize - 1) d++;

    // Find the highest peak
    let maxVal = -1;
    let maxPos = -1;
    for (let i = d; i < trimmedSize; i++) {
        if (c[i] > maxVal) {
            maxVal = c[i];
            maxPos = i;
        }
    }

    // Parabolic interpolation for sub-sample accuracy
    let T0 = maxPos;

    if (maxPos > 0 && maxPos < trimmedSize - 1) {
        const x1 = c[maxPos - 1];
        const x2 = c[maxPos];
        const x3 = c[maxPos + 1];

        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;

        if (a !== 0) {
            T0 = maxPos - b / (2 * a);
        }
    }

    return sampleRate / T0;
};

/**
 * Smooths frequency values using exponential moving average
 */
const smoothFrequency = (
    newFreq: number,
    prevFreq: number,
    smoothingFactor: number = 0.7
): number => {
    if (prevFreq <= 0) return newFreq;
    return prevFreq * smoothingFactor + newFreq * (1 - smoothingFactor);
};

export interface MicrophoneState {
    isActive: boolean;
    frequency: number;
    confidence: number;
    error: string | null;
}

export const useMicrophone = (audioContext: AudioContext | null) => {
    const [state, setState] = useState<MicrophoneState>({
        isActive: false,
        frequency: 0,
        confidence: 0,
        error: null,
    });

    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const lastFreqRef = useRef<number>(0);

    const startMicrophone = useCallback(async () => {
        if (!audioContext) {
            setState(prev => ({ ...prev, error: 'AudioContext not available' }));
            return false;
        }

        // Check if mediaDevices API is available (requires HTTPS)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setState(prev => ({
                ...prev,
                error: 'Microphone requires HTTPS. Please use the deployed site or localhost with HTTPS.'
            }));
            return false;
        }

        try {
            // Resume AudioContext if suspended (required for user gesture in some browsers)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;

            // Create audio source from microphone
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Create analyser for pitch detection
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Good balance between frequency resolution and latency
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            // Connect source to analyser (but NOT to destination - we don't want feedback!)
            source.connect(analyser);

            setState(prev => ({
                ...prev,
                isActive: true,
                error: null,
            }));

            // Start the detection loop
            const bufferLength = analyser.fftSize;
            const buffer = new Float32Array(bufferLength);

            const detectPitch = () => {
                analyser.getFloatTimeDomainData(buffer);

                const frequency = autoCorrelate(buffer, audioContext.sampleRate);

                if (frequency > 0 && frequency < 10000) {
                    // Smooth the frequency to reduce jitter
                    const smoothedFreq = smoothFrequency(frequency, lastFreqRef.current, 0.7);
                    lastFreqRef.current = smoothedFreq;

                    // Calculate confidence based on RMS
                    let rms = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        rms += buffer[i] * buffer[i];
                    }
                    rms = Math.sqrt(rms / bufferLength);
                    const confidence = Math.min(1, rms * 10);

                    setState(prev => ({
                        ...prev,
                        frequency: smoothedFreq,
                        confidence,
                    }));
                } else {
                    // No valid pitch detected - decay frequency slowly
                    if (lastFreqRef.current > 0) {
                        lastFreqRef.current *= 0.95;
                        if (lastFreqRef.current < 20) lastFreqRef.current = 0;
                    }

                    setState(prev => ({
                        ...prev,
                        frequency: lastFreqRef.current,
                        confidence: 0,
                    }));
                }

                rafIdRef.current = requestAnimationFrame(detectPitch);
            };

            detectPitch();
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
            setState(prev => ({
                ...prev,
                isActive: false,
                error: errorMessage,
            }));
            return false;
        }
    }, [audioContext]);

    const stopMicrophone = useCallback(() => {
        // Stop animation frame
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        // Disconnect and cleanup audio nodes
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        // Stop all media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        lastFreqRef.current = 0;

        setState({
            isActive: false,
            frequency: 0,
            confidence: 0,
            error: null,
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMicrophone();
        };
    }, [stopMicrophone]);

    return {
        ...state,
        analyser: analyserRef.current,
        startMicrophone,
        stopMicrophone,
    };
};
