'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSpeech, isWebSpeechSupported } from '@/lib/voice/web-speech';
import { getQuickVoiceCommands } from '@/lib/voice/intent-parser';

// Icônes SVG
const MicrophoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const StopIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const ChevronDownIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

export interface VoiceCommandBarProps {
  onCommand: (text: string) => void;
  onResult?: (message: string, success: boolean) => void;
  disabled?: boolean;
  className?: string;
}

interface CommandResult {
  id: string;
  message: string;
  success: boolean;
  timestamp: Date;
}

export function VoiceCommandBar({
  onCommand,
  onResult,
  disabled = false,
  className = '',
}: VoiceCommandBarProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);
  const resultsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const webSpeech = useWebSpeech({
    lang: 'fr-FR',
    continuous: true, // Mode continu pour plusieurs commandes
    interimResults: true,
  });

  // Vérifier le support
  useEffect(() => {
    setIsSupported(isWebSpeechSupported());
  }, []);

  // Traiter le transcript final
  useEffect(() => {
    if (webSpeech.transcript) {
      onCommand(webSpeech.transcript);
      webSpeech.resetTranscript();
    }
  }, [webSpeech.transcript, onCommand, webSpeech]);

  // Ajouter un résultat
  const addResult = useCallback((message: string, success: boolean) => {
    const result: CommandResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      success,
      timestamp: new Date(),
    };
    
    setResults(prev => [...prev.slice(-2), result]); // Garder max 3 résultats
    
    // Nettoyer après 4 secondes
    if (resultsTimeoutRef.current) {
      clearTimeout(resultsTimeoutRef.current);
    }
    resultsTimeoutRef.current = setTimeout(() => {
      setResults([]);
    }, 4000);

    onResult?.(message, success);
  }, [onResult]);

  // Exposer la fonction addResult via une ref ou un callback
  useEffect(() => {
    // On peut utiliser un événement personnalisé pour communiquer
    const handleResult = (e: CustomEvent<{ message: string; success: boolean }>) => {
      addResult(e.detail.message, e.detail.success);
    };
    
    window.addEventListener('voice-command-result', handleResult as EventListener);
    return () => {
      window.removeEventListener('voice-command-result', handleResult as EventListener);
    };
  }, [addResult]);

  const handleToggle = useCallback(() => {
    if (webSpeech.isListening) {
      webSpeech.stopListening();
    } else {
      webSpeech.startListening();
    }
  }, [webSpeech]);

  const quickCommands = getQuickVoiceCommands();

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Barre principale */}
      <div className={`
        flex items-center gap-3 p-3 rounded-xl
        bg-gradient-to-r from-solaire-bg-elevated to-solaire-bg-card
        border-2 transition-all duration-300
        ${webSpeech.isListening 
          ? 'border-solaire-accent shadow-solaire animate-pulse-border' 
          : 'border-solaire-border'
        }
      `}>
        {/* Bouton micro principal */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            relative w-14 h-14 rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            focus-visible:ring-2 focus-visible:ring-solaire-accent focus-visible:ring-offset-2
            ${webSpeech.isListening
              ? 'bg-solaire-accent text-white shadow-solaire-lg scale-110'
              : 'bg-solaire-bg-card text-solaire-text hover:bg-solaire-accent hover:text-white border-2 border-solaire-border hover:border-solaire-accent'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={webSpeech.isListening ? 'Arrêter l\'écoute' : 'Activer la commande vocale'}
        >
          {/* Animation de pulse quand écoute */}
          {webSpeech.isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-solaire-accent animate-ping opacity-30" />
              <span className="absolute inset-0 rounded-full bg-solaire-accent animate-pulse opacity-50" />
            </>
          )}
          
          {webSpeech.isListening ? (
            <StopIcon className="w-6 h-6 relative z-10" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
        </button>

        {/* Zone de statut et transcript */}
        <div className="flex-1 min-w-0">
          {webSpeech.isListening ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solaire-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-solaire-accent"></span>
                </span>
                <span className="text-sm font-medium text-solaire-accent">
                  Écoute en cours...
                </span>
              </div>
              {webSpeech.interimTranscript && (
                <p className="text-sm text-solaire-text-secondary italic truncate animate-fade-in">
                  &quot;{webSpeech.interimTranscript}&quot;
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-solaire-text">
                🎤 Commande vocale
              </p>
              <p className="text-xs text-solaire-text-muted">
                Cliquez sur le micro et parlez
              </p>
            </div>
          )}
        </div>

        {/* Bouton aide */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className={`
            p-2 rounded-lg transition-colors
            ${showHelp 
              ? 'bg-solaire-accent/20 text-solaire-accent' 
              : 'text-solaire-text-secondary hover:text-solaire-accent hover:bg-solaire-bg-elevated'
            }
          `}
          aria-label="Afficher les commandes"
        >
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Résultats des commandes */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 space-y-2 z-10">
          {results.map((result) => (
            <div
              key={result.id}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                animate-slide-down
                ${result.success 
                  ? 'bg-solaire-success/20 text-solaire-success border border-solaire-success/30' 
                  : 'bg-solaire-warning/20 text-solaire-warning border border-solaire-warning/30'
                }
              `}
            >
              {result.success ? (
                <CheckIcon className="w-4 h-4 shrink-0" />
              ) : (
                <XIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{result.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Panel d'aide avec les commandes */}
      {showHelp && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-solaire-bg-card border border-solaire-border shadow-lg z-20 animate-slide-down">
          <h4 className="text-sm font-semibold text-solaire-accent mb-3">
            Commandes disponibles :
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickCommands.map((cmd, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-solaire-bg-elevated transition-colors">
                <span className="text-solaire-accent font-mono text-xs bg-solaire-accent/10 px-2 py-1 rounded">
                  {cmd.description}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-solaire-border">
            <p className="text-xs text-solaire-text-muted">
              💡 Exemples : &quot;Ajoute un chauffe-eau à 1500 euros&quot;, &quot;Supprime la ligne 2&quot;, &quot;Remise de 10 pourcent&quot;
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {webSpeech.error && (
        <div className="mt-2 px-4 py-2 rounded-lg bg-solaire-error/20 text-solaire-error text-sm">
          {webSpeech.error}
        </div>
      )}

      {/* Style pour l'animation de bordure */}
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% { border-color: var(--solaire-accent); }
          50% { border-color: var(--solaire-accent-glow); }
        }
        .animate-pulse-border {
          animation: pulse-border 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Fonction utilitaire pour émettre un résultat de commande vocale
 */
export function emitVoiceCommandResult(message: string, success: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('voice-command-result', {
      detail: { message, success }
    }));
  }
}

export default VoiceCommandBar;
