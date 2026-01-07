'use client';

import { useState, useRef, useCallback } from 'react';

export interface WhisperOptions {
  apiKey?: string;
  model?: 'whisper-1';
  language?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface UseWhisperReturn {
  // État
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  audioBlob: Blob | null;
  
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  cancelRecording: () => void;
  transcribeAudio: (audio: Blob) => Promise<string>;
  resetTranscript: () => void;
}

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Hook pour utiliser l'API Whisper d'OpenAI
 * Reconnaissance vocale premium avec haute précision
 */
export function useWhisper(options: WhisperOptions = {}): UseWhisperReturn {
  const {
    apiKey,
    model = 'whisper-1',
    language = 'fr',
    temperature = 0,
    responseFormat = 'json',
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Transcrit un fichier audio avec l'API Whisper
   */
  const transcribeAudio = useCallback(
    async (audio: Blob): Promise<string> => {
      if (!apiKey) {
        throw new Error('Clé API OpenAI requise pour utiliser Whisper');
      }

      setIsTranscribing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', audio, 'audio.webm');
        formData.append('model', model);
        formData.append('language', language);
        formData.append('temperature', temperature.toString());
        formData.append('response_format', responseFormat);

        const response = await fetch(WHISPER_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `Erreur API: ${response.status}`
          );
        }

        const data = await response.json();
        const text = data.text || '';
        setTranscript(text);
        return text;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de transcription';
        setError(message);
        throw err;
      } finally {
        setIsTranscribing(false);
      }
    },
    [apiKey, model, language, temperature, responseFormat]
  );

  /**
   * Démarre l'enregistrement audio
   */
  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Choisir le meilleur format supporté
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Erreur d\'enregistrement');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collecter les données toutes les 100ms
      setIsRecording(true);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permission microphone refusée');
        } else if (err.name === 'NotFoundError') {
          setError('Aucun microphone détecté');
        } else {
          setError(`Erreur: ${err.message}`);
        }
      }
      throw err;
    }
  }, []);

  /**
   * Arrête l'enregistrement et transcrit l'audio
   */
  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Aucun enregistrement en cours'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        // Arrêter le stream
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Créer le blob audio
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);

        // Si une clé API est fournie, transcrire automatiquement
        if (apiKey) {
          try {
            const text = await transcribeAudio(blob);
            resolve(text);
          } catch (err) {
            reject(err);
          }
        } else {
          // Sinon, retourner un message indiquant que la transcription manuelle est nécessaire
          resolve('');
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, apiKey, transcribeAudio]);

  /**
   * Annule l'enregistrement en cours
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setAudioBlob(null);
  }, [isRecording]);

  /**
   * Réinitialise le transcript
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setAudioBlob(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    transcribeAudio,
    resetTranscript,
  };
}

/**
 * Vérifie si MediaRecorder est disponible
 */
export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof MediaRecorder !== 'undefined';
}

/**
 * Obtient la durée d'un blob audio en secondes
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0);
    };
    audio.src = URL.createObjectURL(blob);
  });
}

export default useWhisper;
