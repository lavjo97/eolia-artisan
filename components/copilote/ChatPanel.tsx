'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSpeech, isWebSpeechSupported, requestMicrophoneAccess } from '@/lib/voice/web-speech';
import { VoiceFeedback, FeedbackType } from './VoiceFeedback';

// Icônes
const MicIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const SendIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>
  </svg>
);

const SettingsIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);

const MessageIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/>
  </svg>
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isSuccess?: boolean; // Pour le feedback visuel
}

interface ChatPanelProps {
  onMessage: (text: string) => void;
  messages: Message[];
  isProcessing: boolean;
  isConnected: boolean;
  onSettingsClick?: () => void;
  onNewChat?: () => void;
  apiKey?: string;
  lastCommandSuccess?: boolean; // Indique si la dernière commande a réussi
}

export function ChatPanel({
  onMessage,
  messages,
  isProcessing,
  isConnected,
  onSettingsClick,
  onNewChat,
  apiKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lastCommandSuccess,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [micError, setMicError] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const webSpeech = useWebSpeech({
    lang: 'fr-FR',
    continuous: false,
    interimResults: true,
  });

  // Initialiser le support
  useEffect(() => {
    setIsSupported(isWebSpeechSupported());
  }, []);

  // Jouer les sons et afficher le feedback quand une réponse arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    // Vérifier si c'est un nouveau message assistant
    if (messages.length > prevMessagesLengthRef.current && lastMessage?.role === 'assistant') {
      const content = lastMessage.content.toLowerCase();
      
      // Détecter le succès ou l'erreur dans le message
      const isSuccess = content.includes('✓') || 
                        content.includes('ajouté') || 
                        content.includes('modifié') || 
                        content.includes('supprimé') ||
                        content.includes('appliqué') ||
                        content.includes('client :') ||
                        !content.includes('❓') && !content.includes('⚠');
      
      if (isSuccess) {
        setFeedbackType('success');
        setFeedbackMessage('Commande exécutée !');
      } else {
        setFeedbackType('error');
        setFeedbackMessage('Commande non comprise');
      }

      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setFeedbackType('idle');
        setFeedbackMessage('');
      }, 3000);
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Gérer les changements d'état de l'écoute
  useEffect(() => {
    if (webSpeech.isListening) {
      setFeedbackType('listening');
      setFeedbackMessage('Parlez maintenant...');
    } else if (feedbackType === 'listening') {
      setFeedbackType('idle');
      setFeedbackMessage('');
    }
  }, [webSpeech.isListening, feedbackType]);

  // État de traitement
  useEffect(() => {
    if (isProcessing) {
      setFeedbackType('processing');
      setFeedbackMessage('Analyse en cours...');
    }
  }, [isProcessing]);

  // Afficher les erreurs du hook
  useEffect(() => {
    if (webSpeech.error) {
      setMicError(webSpeech.error);
      const timer = setTimeout(() => setMicError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [webSpeech.error]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Traiter le transcript
  useEffect(() => {
    if (webSpeech.transcript) {
      onMessage(webSpeech.transcript);
      webSpeech.resetTranscript();
    }
  }, [webSpeech.transcript, onMessage, webSpeech]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleMicClick = useCallback(async () => {
    setMicError(null);
    
    // Si déjà en écoute, arrêter
    if (webSpeech.isListening) {
      webSpeech.stopListening();
      return;
    }

    // Vérifier/demander les permissions au premier clic
    if (micPermission === 'unknown') {
      try {
        const granted = await requestMicrophoneAccess();
        setMicPermission(granted ? 'granted' : 'denied');
        if (!granted) {
          setMicError('Permission microphone refusée. Cliquez sur l\'icône 🔒 dans la barre d\'adresse pour autoriser.');
          return;
        }
      } catch (err) {
        console.error('Mic permission error:', err);
        setMicError('Impossible d\'accéder au microphone. Vérifiez les permissions.');
        return;
      }
    } else if (micPermission === 'denied') {
      setMicError('Permission microphone refusée. Cliquez sur l\'icône 🔒 dans la barre d\'adresse pour autoriser.');
      return;
    }

    // Démarrer l'écoute
    try {
      webSpeech.startListening();
    } catch (err) {
      console.error('Start listening error:', err);
      setMicError('Erreur lors du démarrage de l\'écoute. Réessayez.');
    }
  }, [webSpeech, micPermission]);

  return (
    <div className="flex flex-col h-full bg-[#1a2234]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-blue-500'
          }`}>
            {isConnected ? (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Eolia Devis</h1>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  IA connectée
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  Mode basique
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/copilote/realtime"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
            title="Mode conversation vocale en temps réel"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            Realtime
          </a>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Paramètres"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Nouveau devis"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feedback visuel */}
      {feedbackType !== 'idle' && (
        <div className="px-4 py-2">
          <VoiceFeedback type={feedbackType} message={feedbackMessage} />
        </div>
      )}

      {/* Status Avatar avec grand bouton micro */}
      <div className="flex flex-col items-center py-6">
        <button
          onClick={handleMicClick}
          disabled={!isSupported || isProcessing}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            webSpeech.isListening 
              ? 'bg-red-500 scale-110' 
              : isProcessing
                ? 'bg-amber-500 animate-pulse'
                : isConnected 
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30' 
                  : 'bg-gray-600 hover:bg-gray-500'
          } ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {/* Animations */}
          {webSpeech.isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              <span className="absolute inset-[-8px] rounded-full border-4 border-red-500/50 animate-pulse" />
            </>
          )}
          
          {/* Icône centrale */}
          {isProcessing ? (
            <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : webSpeech.isListening ? (
            <MicIcon className="w-10 h-10 text-white" />
          ) : isConnected ? (
            <MicIcon className="w-10 h-10 text-white" />
          ) : (
            <MicIcon className="w-8 h-8 text-white" />
          )}
        </button>
        
        <p className="mt-3 text-gray-400 text-sm font-medium">
          {!isSupported 
            ? 'Utilisez Chrome ou Edge'
            : webSpeech.isListening 
              ? '🔴 Écoute en cours...'
              : isProcessing
                ? '⏳ Traitement...'
                : isConnected 
                  ? '🎤 Cliquez pour parler' 
                  : '🎤 Cliquez pour dicter'
          }
        </p>
        
        {/* Message d'aide pour la clé API */}
        {!isConnected && !apiKey && (
          <p className="mt-1 text-gray-500 text-xs">
            ⚙️ Ajoutez votre clé API dans les paramètres pour l&apos;IA avancée
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageIcon className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">
              {isConnected ? 'Assistant IA prêt' : 'Bienvenue !'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {isConnected 
                ? 'Parlez naturellement, l\'IA comprend vos instructions' 
                : 'Cliquez sur le micro et dictez votre devis'
              }
            </p>
            
            {/* Suggestions */}
            <div className="w-full max-w-sm space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Essayez par exemple :</p>
              {[
                'Client Jean Dupont à Fort-de-France',
                'Ajoute climatisation 2500 euros',
                'Remise de 10 pourcent',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onMessage(suggestion)}
                  disabled={isProcessing}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                >
                  &quot;{suggestion}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : msg.content.includes('✓')
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30 rounded-bl-md'
                      : msg.content.includes('❓') || msg.content.includes('⚠')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-bl-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className="text-xs mt-1 block opacity-60">
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Interim transcript */}
        {webSpeech.interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-blue-500/30 text-white/80 rounded-br-md border border-dashed border-blue-400">
              <p className="text-sm italic">{webSpeech.interimTranscript}...</p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        {/* Erreur micro */}
        {micError && (
          <div className="mb-3 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="font-medium">Problème de microphone</p>
              <p className="text-xs mt-1 text-red-300/80">{micError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Petit bouton micro à côté du champ de texte */}
          {isSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`relative p-3 rounded-full transition-all flex-shrink-0 ${
                webSpeech.isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                  : micPermission === 'denied'
                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                    : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
              }`}
              title={
                webSpeech.isListening 
                  ? 'Arrêter l\'écoute' 
                  : micPermission === 'denied' 
                    ? 'Permission microphone refusée' 
                    : 'Cliquez pour parler'
              }
            >
              {webSpeech.isListening && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              )}
              <MicIcon className="w-5 h-5 relative z-10" />
            </button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={webSpeech.isListening ? "Parlez maintenant..." : "Ou écrivez votre message..."}
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-amber-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
