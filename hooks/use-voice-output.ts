"use client";

import { useCallback, useRef, useState } from "react";

export type UseVoiceOutputOptions = {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
};

export function useVoiceOutput({
  voice = null,
  rate = 1,
  pitch = 1,
  volume = 1,
  onStart,
  onEnd,
  onError,
}: UseVoiceOutputOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) {
        setIsSupported(false);
        onError?.(new Error("Speech synthesis not supported"));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      if (voice) {
        utterance.voice = voice;
      } else {
        // Try to find a high-quality voice (prefer Samantha or Alex on macOS)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.name.includes("Samantha") ||
            v.name.includes("Alex") ||
            v.name.includes("Karen") ||
            v.default
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (error) => {
        setIsSpeaking(false);
        onError?.(error);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voice, rate, pitch, volume, onStart, onEnd, onError]
  );

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
  };
}
