'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRealtimeVoice, RealtimeAction } from '@/lib/ai/useRealtimeVoice';

// Icônes
const MicIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const WaveformIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h2"/>
    <path d="M6 8v8"/>
    <path d="M10 5v14"/>
    <path d="M14 8v8"/>
    <path d="M18 11v2"/>
    <path d="M22 12h-2"/>
  </svg>
);

const PhoneOffIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

interface RealtimeVoiceButtonProps {
  apiKey: string | undefined;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onActions?: (actions: RealtimeAction[]) => void;
  disabled?: boolean;
  className?: string;
}

export function RealtimeVoiceButton({
  apiKey,
  onTranscript,
  onResponse,
  onActions,
  disabled = false,
  className = '',
}: RealtimeVoiceButtonProps) {
  const [showStatus, setShowStatus] = useState(false);

  const {
    isConnected,
    isProcessing,
    isListening,
    isSpeaking,
    transcript,
    error,
    actions,
    connect,
    disconnect,
    startListening,
    stopListening,
  } = useRealtimeVoice({
    apiKey,
    onTranscript: (text) => {
      onTranscript(text);
    },
    onResponse,
    onAction: (action) => {
      console.log('Action received:', action);
    },
    onError: (err) => {
      console.error('Realtime error:', err);
    },
  });

  // Transmettre les actions au parent
  useEffect(() => {
    if (actions.length > 0 && onActions) {
      onActions(actions);
    }
  }, [actions, onActions]);

  // Afficher le statut pendant 3 secondes après un changement
  useEffect(() => {
    if (error || isProcessing) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, isProcessing]);

  const handleClick = useCallback(async () => {
    if (disabled || !apiKey) return;

    if (isListening) {
      stopListening();
    } else if (isConnected) {
      await startListening();
    } else {
      await connect();
      await startListening();
    }
  }, [disabled, apiKey, isListening, isConnected, stopListening, startListening, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Couleur et état du bouton
  const getButtonStyle = () => {
    if (disabled || !apiKey) {
      return 'bg-gray-700/50 text-gray-500 cursor-not-allowed';
    }
    if (isSpeaking) {
      return 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 animate-pulse';
    }
    if (isListening) {
      return 'bg-red-500 text-white shadow-lg shadow-red-500/40';
    }
    if (isProcessing) {
      return 'bg-amber-500 text-white animate-pulse';
    }
    if (isConnected) {
      return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
    }
    return 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600';
  };

  const getIcon = () => {
    if (isSpeaking) {
      return <WaveformIcon className="w-5 h-5" />;
    }
    if (isListening) {
      return <MicIcon className="w-5 h-5" />;
    }
    return <MicIcon className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (!apiKey) return 'Configurer l\'API';
    if (isSpeaking) return 'IA parle...';
    if (isListening) return 'Écoute...';
    if (isProcessing) return 'Traitement...';
    if (isConnected) return 'Prêt';
    return 'Conversation IA';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton principal */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || !apiKey}
          className={`
            relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
            transition-all duration-200
            ${getButtonStyle()}
          `}
        >
          {/* Animation de pulsation */}
          {(isListening || isSpeaking) && (
            <>
              <span className="absolute inset-0 rounded-xl bg-current opacity-20 animate-ping" />
              <span className="absolute inset-0 rounded-xl bg-current opacity-10 animate-pulse" />
            </>
          )}
          
          <span className="relative z-10 flex items-center gap-2">
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
          </span>
        </button>

        {/* Bouton déconnexion */}
        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Déconnecter"
          >
            <PhoneOffIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Transcript en cours */}
      {isListening && transcript && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-sm text-white">
          <p className="italic">&quot;{transcript}&quot;</p>
        </div>
      )}

      {/* Statut / Erreur */}
      {showStatus && (error || isProcessing) && (
        <div className={`
          absolute top-full left-0 right-0 mt-2 p-2 rounded-lg text-xs
          ${error ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}
        `}>
          {error || 'Traitement en cours...'}
        </div>
      )}
    </div>
  );
}

export default RealtimeVoiceButton;
