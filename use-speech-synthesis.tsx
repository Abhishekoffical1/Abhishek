import { useState, useCallback } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  speaking: boolean;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  supported: boolean;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [speaking, setSpeaking] = useState(false);
  const supported = 'speechSynthesis' in window;

  const speak = useCallback((text: string) => {
    if (!supported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set up event handlers
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    // Try to use a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Enhanced') ||
      voice.default
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported) {
      window.speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  return {
    speak,
    speaking,
    stop,
    pause,
    resume,
    supported
  };
}