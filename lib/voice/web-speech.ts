'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types pour l'API Web Speech
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface WebSpeechOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onInterimResult?: (text: string) => void;
}

export interface WebSpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface UseWebSpeechReturn {
  // État
  isSupported: boolean;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  
  // Actions
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook pour utiliser l'API Web Speech du navigateur
 * Reconnaissance vocale gratuite et native
 */
export function useWebSpeech(options: WebSpeechOptions = {}): UseWebSpeechReturn {
  const {
    lang = 'fr-FR',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onInterimResult,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Vérifier le support du navigateur
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;

          if (result.isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + finalText);
          setInterimTranscript('');
        }

        if (interimText) {
          setInterimTranscript(interimText);
          onInterimResult?.(interimText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setIsProcessing(false);

        const errorMessages: Record<string, string> = {
          'no-speech': 'Aucune parole détectée. Réessayez.',
          'audio-capture': 'Microphone non disponible.',
          'not-allowed': 'Permission microphone refusée.',
          'network': 'Erreur réseau. Vérifiez votre connexion.',
          'aborted': 'Reconnaissance interrompue.',
          'language-not-supported': 'Langue non supportée.',
          'service-not-allowed': 'Service de reconnaissance non disponible.',
        };

        setError(errorMessages[event.error] || `Erreur: ${event.error}`);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, interimResults, maxAlternatives, onInterimResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setError(null);
    setIsProcessing(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Gérer le cas où la reconnaissance est déjà en cours
      if (err instanceof Error && err.message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 100);
      } else {
        setError('Impossible de démarrer la reconnaissance vocale.');
        setIsProcessing(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    recognitionRef.current.stop();
    setIsProcessing(false);
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

/**
 * Vérifie si l'API Web Speech est disponible
 */
export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Vérifie si le microphone est accessible
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    // Fallback pour les navigateurs qui ne supportent pas l'API Permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return 'granted';
    } catch {
      return 'denied';
    }
  }

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Demande l'accès au microphone
 */
export async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export default useWebSpeech;
