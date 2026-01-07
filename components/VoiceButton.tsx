'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWebSpeech, isWebSpeechSupported, checkMicrophonePermission, requestMicrophoneAccess } from '@/lib/voice/web-speech';
import { useWhisper, isMediaRecorderSupported } from '@/lib/voice/whisper';

// Icônes SVG inline
const MicrophoneIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const StopIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SparklesIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export type VoiceMode = 'web-speech' | 'whisper' | 'auto';

export interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  mode?: VoiceMode;
  whisperApiKey?: string;
  language?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

/**
 * Composant VoiceButton - Bouton de reconnaissance vocale
 * Utilise Web Speech API par défaut, ou Whisper si une clé API est fournie
 */
export function VoiceButton({
  onTranscript,
  onInterimTranscript,
  mode = 'auto',
  whisperApiKey,
  language = 'fr-FR',
  className = '',
  size = 'md',
  showStatus = true,
  disabled = false,
}: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [activeMode, setActiveMode] = useState<'web-speech' | 'whisper'>('web-speech');

  // Hooks pour les deux modes
  const webSpeech = useWebSpeech({
    lang: language,
    continuous: false,
    interimResults: true,
    onInterimResult: onInterimTranscript,
  });

  const whisper = useWhisper({
    apiKey: whisperApiKey,
    language: language.split('-')[0],
  });

  // Déterminer le mode actif
  useEffect(() => {
    const webSpeechAvailable = isWebSpeechSupported();
    const mediaRecorderAvailable = isMediaRecorderSupported();

    setIsSupported(webSpeechAvailable || (mediaRecorderAvailable && !!whisperApiKey));

    if (mode === 'whisper' && whisperApiKey && mediaRecorderAvailable) {
      setActiveMode('whisper');
    } else if (mode === 'web-speech' && webSpeechAvailable) {
      setActiveMode('web-speech');
    } else if (mode === 'auto') {
      // Auto: préférer Web Speech si disponible (gratuit), sinon Whisper
      if (webSpeechAvailable) {
        setActiveMode('web-speech');
      } else if (mediaRecorderAvailable && whisperApiKey) {
        setActiveMode('whisper');
      }
    }
  }, [mode, whisperApiKey]);

  // Vérifier la permission microphone
  useEffect(() => {
    checkMicrophonePermission().then(setMicPermission);
  }, []);

  // Écouter les changements de transcript Web Speech
  useEffect(() => {
    if (activeMode === 'web-speech' && webSpeech.transcript) {
      onTranscript(webSpeech.transcript);
      webSpeech.resetTranscript();
    }
  }, [activeMode, webSpeech.transcript, onTranscript, webSpeech]);

  // Écouter les changements de transcript Whisper
  useEffect(() => {
    if (activeMode === 'whisper' && whisper.transcript) {
      onTranscript(whisper.transcript);
      whisper.resetTranscript();
    }
  }, [activeMode, whisper.transcript, onTranscript, whisper]);

  const isRecording =
    activeMode === 'web-speech' ? webSpeech.isListening : whisper.isRecording;

  const isProcessing =
    activeMode === 'web-speech' ? webSpeech.isProcessing : whisper.isTranscribing;

  const error =
    activeMode === 'web-speech' ? webSpeech.error : whisper.error;

  const handleClick = useCallback(async () => {
    if (disabled) return;

    // Demander la permission si nécessaire
    if (micPermission === 'prompt') {
      const granted = await requestMicrophoneAccess();
      setMicPermission(granted ? 'granted' : 'denied');
      if (!granted) return;
    }

    if (micPermission === 'denied') {
      return;
    }

    if (activeMode === 'web-speech') {
      webSpeech.toggleListening();
    } else {
      if (whisper.isRecording) {
        await whisper.stopRecording();
      } else {
        await whisper.startRecording();
      }
    }
  }, [disabled, micPermission, activeMode, webSpeech, whisper]);

  // Déterminer l'état du bouton
  const getButtonState = () => {
    if (!isSupported) return 'unsupported';
    if (micPermission === 'denied') return 'denied';
    if (isProcessing) return 'processing';
    if (isRecording) return 'recording';
    return 'idle';
  };

  const state = getButtonState();

  // Styles selon l'état
  const stateStyles = {
    idle: 'bg-solaire-bg-elevated hover:bg-solaire-bg-card text-solaire-text hover:text-solaire-accent border-2 border-solaire-border hover:border-solaire-accent',
    recording: 'bg-solaire-accent text-solaire-text-inverse border-2 border-solaire-accent animate-recording shadow-solaire',
    processing: 'bg-solaire-accent/50 text-solaire-text-inverse border-2 border-solaire-accent/50',
    denied: 'bg-solaire-error/20 text-solaire-error border-2 border-solaire-error/50 cursor-not-allowed',
    unsupported: 'bg-solaire-bg-elevated/50 text-solaire-text-muted border-2 border-solaire-border cursor-not-allowed opacity-50',
  };

  const statusMessages = {
    idle: 'Appuyer pour parler',
    recording: 'Écoute en cours...',
    processing: 'Traitement...',
    denied: 'Microphone refusé',
    unsupported: 'Non supporté',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === 'unsupported' || state === 'denied'}
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          transition-all duration-200 ease-out
          focus-visible:ring-2 focus-visible:ring-solaire-accent focus-visible:ring-offset-2 focus-visible:ring-offset-solaire-bg
          no-tap-highlight
          ${stateStyles[state]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
      >
        {isProcessing ? (
          <span className="loading-spinner" />
        ) : isRecording ? (
          <StopIcon className={iconSizes[size]} />
        ) : (
          <MicrophoneIcon className={iconSizes[size]} />
        )}
      </button>

      {showStatus && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-solaire-text-secondary">
            {statusMessages[state]}
          </span>

          {activeMode === 'whisper' && !error && (
            <span className="flex items-center gap-1 text-xs text-solaire-accent-glow">
              <SparklesIcon className="w-3 h-3" />
              Premium
            </span>
          )}

          {error && (
            <span className="text-xs text-solaire-error text-center max-w-[150px]">
              {error}
            </span>
          )}

          {webSpeech.interimTranscript && activeMode === 'web-speech' && (
            <span className="text-xs text-solaire-text-muted italic max-w-[200px] text-center animate-fade-in">
              {webSpeech.interimTranscript}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default VoiceButton;
