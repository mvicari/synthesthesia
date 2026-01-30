import { useRef, useEffect, useCallback } from 'react';

export const useAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  // Active nodes storage
  const oscillators = useRef<Map<number, OscillatorNode>>(new Map());
  const gains = useRef<Map<number, GainNode>>(new Map());
  const waveformRef = useRef<OscillatorType>('sine');

  // Global control state refs (so new notes spawn with correct values)
  const currentPitchBend = useRef<number>(0); // in semitones

  const setWaveform = useCallback((type: OscillatorType) => {
    waveformRef.current = type;
    // Update all currently playing oscillators
    oscillators.current.forEach(osc => {
      osc.type = type;
    });
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          console.error("Web Audio API not supported");
          return;
        }
        audioContext.current = new AudioCtx();

        console.log("AudioContext created. State:", audioContext.current.state);

        masterGain.current = audioContext.current.createGain();
        masterGain.current.gain.setValueAtTime(0.4, audioContext.current.currentTime);

        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 1024; // Smaller for smoother visual updates

        masterGain.current.connect(analyser.current);
        analyser.current.connect(audioContext.current.destination);

        // iOS Unlock: Play a silent buffer
        const buffer = audioContext.current.createBuffer(1, 1, 22050);
        const source = audioContext.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.current.destination);
        source.start(0);

        // Force resume on creation
        audioContext.current.resume();
      } catch (e) {
        console.error("Failed to initialize audio:", e);
      }
    } else if (audioContext.current.state !== 'running') {
      audioContext.current.resume().catch(e => console.warn("Resume failed:", e));
    }
  }, []);

  const setPitchBend = useCallback((semitones: number) => {
    if (!audioContext.current) return;
    currentPitchBend.current = semitones;

    // 1 semitone = 100 cents
    const detuneValue = semitones * 100;

    oscillators.current.forEach((osc) => {
      osc.detune.setValueAtTime(detuneValue, audioContext.current!.currentTime);
    });
  }, []);

  const playTone = useCallback((frequency: number) => {
    initAudio();
    if (!audioContext.current || !masterGain.current) return;

    if (oscillators.current.has(frequency)) return;

    const currentTime = audioContext.current.currentTime;

    // 1. Create Nodes
    const osc = audioContext.current.createOscillator();
    const noteGain = audioContext.current.createGain();

    // 2. Configure Main Oscillator
    osc.type = waveformRef.current;
    osc.frequency.setValueAtTime(frequency, currentTime);
    osc.detune.setValueAtTime(currentPitchBend.current * 100, currentTime);

    // 3. Connect Graph
    osc.connect(noteGain);
    noteGain.connect(masterGain.current);

    // 4. Envelope: Attack
    noteGain.gain.setValueAtTime(0.001, currentTime);
    noteGain.gain.exponentialRampToValueAtTime(1, currentTime + 0.05);

    console.log(`Playing ${frequency}Hz at context time: ${currentTime.toFixed(3)}`);

    // 5. Start
    osc.start();

    // 6. Store
    oscillators.current.set(frequency, osc);
    gains.current.set(frequency, noteGain);

  }, [initAudio]);

  const stopTone = useCallback((frequency: number) => {
    if (!audioContext.current) return;

    const osc = oscillators.current.get(frequency);
    const noteGain = gains.current.get(frequency);

    if (osc && noteGain) {
      const stopTime = audioContext.current.currentTime + 0.15; // Slightly faster release for snappy saw
      noteGain.gain.cancelScheduledValues(audioContext.current.currentTime);
      noteGain.gain.setValueAtTime(noteGain.gain.value, audioContext.current.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

      osc.stop(stopTime);

      setTimeout(() => {
        osc.disconnect();
        noteGain.disconnect();
      }, 200);

      oscillators.current.delete(frequency);
      gains.current.delete(frequency);
    }
  }, []);

  useEffect(() => {
    const resume = () => {
      if (audioContext.current && audioContext.current.state !== 'running') {
        audioContext.current.resume();
      }
    };
    window.addEventListener('click', resume);
    window.addEventListener('touchstart', resume);

    return () => {
      window.removeEventListener('click', resume);
      window.removeEventListener('touchstart', resume);
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return {
    playTone,
    stopTone,
    initAudio,
    setPitchBend,
    setWaveform,
    analyser,
    audioContext,
    currentWaveform: waveformRef.current
  };
};