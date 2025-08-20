import { useState, useEffect, useCallback } from 'react';

// A standard Javascript object for configuration to ensure maximum compatibility.
const personaVoiceConfig = {
  'Janus': { pitch: 1.0, rate: 1.0 },
  'Athena': { pitch: 1.2, rate: 1.0 },
  'Vulcan': { pitch: 0.8, rate: 0.9 },
  'Glitch': { pitch: 1.5, rate: 1.2 },
  'Default': { pitch: 1.0, rate: 1.0 },
};

// This custom hook manages all text-to-speech functionality.
export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // This effect runs only once in the browser to get the available voices.
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
    // Voices can load asynchronously, so we listen for the 'voiceschanged' event.
    synth.onvoiceschanged = loadVoices;

    return () => {
      if (synth) {
        synth.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback((text: string, personaName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }
    const synth = window.speechSynthesis;

    // If the AI is already talking, stop it before starting the new message.
    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const config = personaVoiceConfig[personaName as keyof typeof personaVoiceConfig] || personaVoiceConfig.Default;

    // Find the best available voice in the user's browser.
    const preferredVoice = voices.find(voice => voice.name.includes(personaName) && voice.lang.startsWith('en'));
    const fallbackVoice = voices.find(voice => voice.lang.startsWith('en'));
    
    utterance.voice = preferredVoice || fallbackVoice || null;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    synth.speak(utterance);
  }, [voices]);

  return { speak };
};