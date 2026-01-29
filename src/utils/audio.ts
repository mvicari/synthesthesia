import { useRef, useEffect, useCallback } from 'react';

export const useAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  
  // Active nodes storage
  const oscillators = useRef<Map<number, OscillatorNode>>(new Map());
  const gains = useRef<Map<number, GainNode>>(new Map());

  // Global control state refs (so new notes spawn with correct values)
  const currentPitchBend = useRef<number>(0); // in semitones

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      masterGain.current = audioContext.current.createGain();
      masterGain.current.gain.value = 0.3; 

      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 2048; // Higher res for waveform

      // Master -> Analyser -> Destination
      masterGain.current.connect(analyser.current);
      analyser.current.connect(audioContext.current.destination);

    } else if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
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
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, currentTime);
    osc.detune.setValueAtTime(currentPitchBend.current * 100, currentTime);

    // 3. Connect Graph
    osc.connect(noteGain);
    noteGain.connect(masterGain.current);

    // 4. Envelope: Attack
    noteGain.gain.setValueAtTime(0, currentTime);
    noteGain.gain.linearRampToValueAtTime(1, currentTime + 0.05);

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
      const stopTime = audioContext.current.currentTime + 0.2;
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
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return { playTone, stopTone, initAudio, setPitchBend, analyser };
};