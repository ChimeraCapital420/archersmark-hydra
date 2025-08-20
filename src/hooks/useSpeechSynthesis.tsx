import { useState, useEffect, useCallback } from 'react';

// This custom hook manages all text-to-speech functionality.
export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, personaName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }
    const synth = window.speechSynthesis;

    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get saved settings from localStorage
    const savedSettings = localStorage.getItem('hydraVoiceSettings');
    const voiceSettings = savedSettings ? JSON.parse(savedSettings) : {};
    const preferredVoiceURI = voiceSettings[personaName];
    
    const selectedVoice = voices.find(voice => voice.voiceURI === preferredVoiceURI);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Fallback if no voice is saved or found
      const fallbackVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (fallbackVoice) {
        utterance.voice = fallbackVoice;
      }
    }
    
    synth.speak(utterance);
  }, [voices]);

  return { speak };
};