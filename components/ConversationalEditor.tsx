'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceButton, VoiceMode } from '@/components/VoiceButton';
import { DevisFormData } from '@/components/DevisForm';
import {
  parseVoiceIntent,
  applyIntentToForm,
  getVoiceExamples,
  ConversationMessage,
} from '@/lib/voice/intent-parser';
import { applyAIActions, ExtractedAction } from '@/lib/ai/chat-service';
import { getTauxTVA, DepartementDOM, TypeTVA } from '@/lib/types';

// Icônes SVG
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const MicIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const SendIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const SparklesIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const HelpIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
  </svg>
);

const BrainIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
);

export interface ConversationalEditorProps {
  formData: DevisFormData;
  onFormDataChange: (data: DevisFormData) => void;
  voiceMode?: VoiceMode;
  whisperApiKey?: string;
  className?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function ConversationalEditor({
  formData,
  onFormDataChange,
  voiceMode = 'auto',
  whisperApiKey,
  className = '',
}: ConversationalEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vérifier si l'API IA est configurée
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        setAiEnabled(data.aiEnabled);
      })
      .catch(() => {
        setAiEnabled(false);
      });
  }, []);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = aiEnabled 
        ? '👋 Bonjour ! Je suis votre assistant IA pour créer ce devis.\n\n🧠 Mode IA activé - Je comprends vos instructions naturellement !\n\nDictez ou tapez librement, par exemple :\n• "Le client Jean Dupont habite au 15 rue des Palmiers à Fort-de-France"\n• "Ajoute un chauffe-eau solaire 200L à 1500 euros et 2 panneaux à 800 euros chacun"'
        : '👋 Bonjour ! Je suis votre assistant pour créer ce devis.\n\nDictez ou tapez vos instructions, par exemple :\n• "Le client s\'appelle Jean Dupont"\n• "Ajoute une ligne chauffe-eau à 1500 euros"\n\n💡 Conseil : Configurez une clé API OpenAI pour une compréhension plus naturelle !';
      
      setMessages([
        {
          id: generateId(),
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, aiEnabled]);

  // Fonction pour obtenir le taux TVA
  const getDepartmentTVA = useCallback((dept: string, type: TypeTVA): number => {
    return getTauxTVA(dept as DepartementDOM, type);
  }, []);

  // Fonction pour obtenir le taux TVA simple (pour l'API)
  const getTVARate = useCallback((dept: string): number => {
    return getTauxTVA(dept as DepartementDOM, 'normal');
  }, []);

  // Traiter avec l'API IA
  const processWithAI = useCallback(async (text: string): Promise<{ message: string; actions: ExtractedAction[]; fallback?: boolean }> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          formData,
          conversationHistory: conversationHistory.slice(-10),
        }),
      });

      const data = await response.json();
      
      if (data.fallback || data.error) {
        return { message: data.message, actions: [], fallback: true };
      }

      return {
        message: data.message,
        actions: data.actions || [],
      };
    } catch (error) {
      console.error('AI API error:', error);
      return { message: '⚠️ Erreur de connexion. Mode basique activé.', actions: [], fallback: true };
    }
  }, [formData, conversationHistory]);

  // Traiter avec le parseur local (fallback)
  const processWithLocalParser = useCallback((text: string) => {
    const intent = parseVoiceIntent(text);
    const { updatedData, message } = applyIntentToForm(intent, formData, getDepartmentTVA);
    
    return {
      message,
      updatedData: intent.type !== 'unknown' && intent.confidence >= 0.4 ? updatedData : null,
    };
  }, [formData, getDepartmentTVA]);

  // Traiter une instruction (vocale ou textuelle)
  const processInstruction = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    // Ajouter le message utilisateur
    const userMessage: ConversationMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content: text }]);
    setInputText('');
    setInterimText('');

    let responseMessage: string;
    let applied = false;

    if (aiEnabled) {
      // Utiliser l'API IA
      const aiResponse = await processWithAI(text);
      
      if (aiResponse.fallback) {
        // Fallback vers le parseur local
        const localResult = processWithLocalParser(text);
        responseMessage = localResult.message;
        if (localResult.updatedData) {
          onFormDataChange(localResult.updatedData);
          applied = true;
        }
      } else {
        responseMessage = aiResponse.message;
        
        if (aiResponse.actions && aiResponse.actions.length > 0) {
          const updatedData = applyAIActions(aiResponse.actions, formData, getTVARate);
          onFormDataChange(updatedData);
          applied = true;
        }
      }
    } else {
      // Mode basique (parseur local)
      const localResult = processWithLocalParser(text);
      responseMessage = localResult.message;
      if (localResult.updatedData) {
        onFormDataChange(localResult.updatedData);
        applied = true;
      }
    }

    // Ajouter la réponse de l'assistant
    const assistantMessage: ConversationMessage = {
      id: generateId(),
      role: 'assistant',
      content: responseMessage,
      timestamp: new Date(),
      applied,
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setConversationHistory(prev => [...prev, { role: 'assistant', content: responseMessage }]);
    setIsProcessing(false);
  }, [aiEnabled, processWithAI, processWithLocalParser, formData, onFormDataChange, getTVARate]);

  // Gérer la transcription vocale
  const handleVoiceTranscript = useCallback((text: string) => {
    processInstruction(text);
  }, [processInstruction]);

  // Gérer la transcription intermédiaire
  const handleInterimTranscript = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  // Gérer la soumission du formulaire texte
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    processInstruction(inputText);
  }, [inputText, processInstruction]);

  // Exemples de commandes
  const examples = getVoiceExamples();

  // Exemples avancés pour le mode IA
  const aiExamples = [
    'Le client Jean Dupont habite au 15 rue des Palmiers, Fort-de-France, 97200',
    'Devis pour installation d\'un chauffe-eau solaire avec 2 panneaux',
    'Ajoute un chauffe-eau 300L à 2000€ et la pose à 500€',
    'Mets 3 panneaux à 800 euros pièce',
    'Le délai c\'est 2 semaines après acceptation',
    'Supprime la dernière ligne',
  ];

  return (
    <>
      {/* Bouton flottant pour ouvrir l'éditeur */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          w-16 h-16 rounded-full
          bg-gradient-to-br from-solaire-accent to-solaire-accent-dark
          text-white shadow-solaire-lg
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-200
          ${isOpen ? 'scale-0' : 'scale-100'}
          ${className}
        `}
        aria-label="Ouvrir l'assistant vocal"
      >
        <MicIcon className="w-7 h-7" />
        {aiEnabled && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <BrainIcon className="w-3 h-3 text-white" />
          </span>
        )}
        {!aiEnabled && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-solaire-success rounded-full animate-pulse" />
        )}
      </button>

      {/* Panel de conversation */}
      <div
        className={`
          fixed inset-0 z-50
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Panel */}
        <div
          className={`
            absolute bottom-0 right-0 left-0 md:left-auto md:w-[450px] md:m-4 md:bottom-4 md:right-4
            max-h-[85vh] md:max-h-[700px]
            bg-solaire-bg-card rounded-t-3xl md:rounded-2xl
            shadow-2xl border border-solaire-border
            flex flex-col
            transition-all duration-300 ease-out
            ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-solaire-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                aiEnabled 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-br from-solaire-accent to-solaire-accent-dark'
              }`}>
                {aiEnabled ? (
                  <BrainIcon className="w-5 h-5 text-white" />
                ) : (
                  <SparklesIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-solaire-text flex items-center gap-2">
                  Assistant Devis
                  {aiEnabled && (
                    <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-full">
                      IA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-solaire-text-muted">
                  {aiEnabled ? 'Compréhension naturelle activée' : 'Dictez vos instructions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 rounded-full hover:bg-solaire-bg-elevated text-solaire-text-secondary hover:text-solaire-accent transition-colors"
                aria-label="Aide"
              >
                <HelpIcon />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-solaire-bg-elevated text-solaire-text-secondary hover:text-solaire-text transition-colors"
                aria-label="Fermer"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Aide */}
          {showHelp && (
            <div className="p-4 bg-solaire-accent/10 border-b border-solaire-border animate-slide-down max-h-48 overflow-y-auto">
              <h4 className="font-medium text-solaire-accent mb-2">
                {aiEnabled ? '🧠 Exemples (mode IA) :' : 'Exemples de commandes :'}
              </h4>
              <ul className="space-y-1">
                {(aiEnabled ? aiExamples : examples).map((example, i) => (
                  <li
                    key={i}
                    className="text-sm text-solaire-text-secondary cursor-pointer hover:text-solaire-accent transition-colors"
                    onClick={() => {
                      setInputText(example);
                      setShowHelp(false);
                      inputRef.current?.focus();
                    }}
                  >
                    • {example}
                  </li>
                ))}
              </ul>
              {!aiEnabled && (
                <p className="mt-3 text-xs text-solaire-text-muted border-t border-solaire-border pt-2">
                  💡 Ajoutez <code className="bg-solaire-bg-elevated px-1 rounded">OPENAI_API_KEY</code> dans .env.local pour activer le mode IA avancé
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-3
                    ${msg.role === 'user'
                      ? 'bg-solaire-accent text-white rounded-br-md'
                      : 'bg-solaire-bg-elevated text-solaire-text rounded-bl-md'
                    }
                    ${msg.applied === false && msg.role === 'assistant' ? 'border-l-2 border-solaire-warning' : ''}
                    animate-fade-in
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${msg.role === 'user' ? 'text-white/60' : 'text-solaire-text-muted'}`}>
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Indicateur de traitement */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-solaire-bg-elevated rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-solaire-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-solaire-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-solaire-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {aiEnabled && (
                      <span className="text-xs text-solaire-text-muted">Réflexion...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Texte intermédiaire de la dictée */}
            {interimText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-solaire-accent/30 text-solaire-text rounded-br-md border border-dashed border-solaire-accent">
                  <p className="text-sm italic">{interimText}...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t border-solaire-border bg-solaire-bg-elevated/50">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              {/* Bouton vocal */}
              <VoiceButton
                size="md"
                showStatus={false}
                mode={voiceMode}
                whisperApiKey={whisperApiKey}
                onTranscript={handleVoiceTranscript}
                onInterimTranscript={handleInterimTranscript}
              />

              {/* Champ de saisie texte */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={aiEnabled ? "Parlez naturellement..." : "Tapez ou dictez votre instruction..."}
                  className="
                    w-full px-4 py-3 pr-12
                    bg-solaire-bg-card border border-solaire-border rounded-xl
                    text-solaire-text placeholder:text-solaire-text-muted
                    focus:outline-none focus:ring-2 focus:ring-solaire-accent focus:border-transparent
                    transition-all
                  "
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    w-9 h-9 rounded-lg
                    bg-solaire-accent text-white
                    flex items-center justify-center
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-solaire-accent-dark
                    transition-all
                  "
                >
                  <SendIcon />
                </button>
              </div>
            </form>

            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-2 mt-3">
              {(aiEnabled 
                ? ['Nouveau client', 'Ajouter prestation', 'Modifier', 'Conditions']
                : ['Ajouter ligne', 'Modifier prix', 'Client']
              ).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setShowHelp(true)}
                  className="
                    px-3 py-1 text-xs
                    bg-solaire-bg-card border border-solaire-border rounded-full
                    text-solaire-text-secondary
                    hover:border-solaire-accent hover:text-solaire-accent
                    transition-colors
                  "
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConversationalEditor;
