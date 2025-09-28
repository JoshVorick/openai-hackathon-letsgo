"use client";

import { useCallback, useRef, useState } from "react";

// Type declarations for Web Speech API
declare global {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Global interface required
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type UseVoiceInputOptions = {
  onResult?: (transcript: string) => void;
  onError?: (error: any) => void;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
};

export function useVoiceInput({
  onResult,
  onError,
  continuous = false,
  interimResults = false,
  lang = "en-US",
}: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any | null>(null);

  const startListening = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult?.(transcript);
        if (!continuous) {
          setIsListening(false);
        }
      };

      recognition.onerror = (error: any) => {
        setIsListening(false);
        onError?.(error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      setIsSupported(false);
      onError?.(new Error("Speech recognition not supported"));
    }
  }, [onResult, onError, continuous, interimResults, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
