'use client';

/**
 * Hook React pour l'API Realtime d'OpenAI
 * Mode silencieux : écoute vocale → transcription → exécution directe sans réponse vocale
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface RealtimeAction {
  type: 'update_client' | 'add_line' | 'update_line' | 'delete_line' | 'apply_discount' | 'set_object' | 'unknown';
  params?: Record<string, unknown>;
}

export interface RealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  response: string;
  error: string | null;
  actions: RealtimeAction[];
}

export interface UseRealtimeVoiceOptions {
  apiKey?: string;
  onAction?: (action: RealtimeAction) => void;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onActionsExtracted?: (actions: RealtimeAction[]) => void;
}

// Instructions système optimisées pour exécution directe sans réponse vocale
const DEVIS_INSTRUCTIONS = `Tu es un assistant silencieux pour la création de devis artisan.
Tu reçois des commandes vocales et tu retournes UNIQUEMENT des actions JSON sans parler.

RÈGLES STRICTES:
- Tu ne parles JAMAIS à l'utilisateur
- Tu retournes UNIQUEMENT du JSON valide
- Tu exécutes les actions directement
- Si une information est ambiguë, fais de ton mieux

DÉPARTEMENTS DOM-TOM (TVA):
- 971: Guadeloupe (8.5%)
- 972: Martinique (8.5%)
- 973: Guyane (0%)
- 974: La Réunion (8.5%)
- 976: Mayotte (0%)

FORMAT DE RÉPONSE (JSON UNIQUEMENT):
{
  "actions": [
    {"type": "update_client", "params": {"nom": "...", "prenom": "...", "adresse": "...", "ville": "...", "department": "972"}},
    {"type": "add_line", "params": {"designation": "...", "quantite": 1, "prixUnitaireHT": 0, "unite": "u"}},
    {"type": "update_line", "params": {"index": -1, "field": "quantite", "value": 3}},
    {"type": "delete_line", "params": {"index": -1}},
    {"type": "apply_discount", "params": {"type": "percent", "value": 10}},
    {"type": "set_object", "params": {"objet": "..."}}
  ]
}

EXEMPLES DE MAPPING:
- "Le client c'est Jean Dupont" → {"actions": [{"type": "update_client", "params": {"nom": "Dupont", "prenom": "Jean"}}]}
- "Ajoute climatisation 2500 euros" → {"actions": [{"type": "add_line", "params": {"designation": "Climatisation", "quantite": 1, "prixUnitaireHT": 2500, "unite": "u"}}]}
- "Non mets plutôt 3" → {"actions": [{"type": "update_line", "params": {"index": -1, "field": "quantite", "value": 3}}]}
- "Remise 10 pourcent" → {"actions": [{"type": "apply_discount", "params": {"type": "percent", "value": 10}}]}
- "Supprime la dernière ligne" → {"actions": [{"type": "delete_line", "params": {"index": -1}}]}
- "L'objet c'est installation climatisation" → {"actions": [{"type": "set_object", "params": {"objet": "Installation climatisation"}}]}

VILLES DOM CONNUES:
- Fort-de-France, Le Lamentin → 972 (Martinique)
- Pointe-à-Pitre, Les Abymes → 971 (Guadeloupe)
- Cayenne, Kourou → 973 (Guyane)
- Saint-Denis, Saint-Pierre → 974 (La Réunion)

IMPORTANT: Ne génère AUCUN texte hors du JSON. Pas de "spoken", pas de message.`;

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const { apiKey, onAction, onTranscript, onResponse, onError, onActionsExtracted } = options;

  // État
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    response: '',
    error: null,
    actions: [],
  });

  // Références
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const responseTextRef = useRef<string>('');

  // Mettre à jour un champ de l'état
  const updateState = useCallback((updates: Partial<RealtimeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Conversion Float32 vers PCM16
  const floatTo16BitPCM = useCallback((float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }, []);

  // ArrayBuffer vers Base64
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Parser et exécuter les actions de la réponse
  const executeActions = useCallback((text: string) => {
    try {
      // Nettoyer le texte (enlever les backticks markdown si présents)
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);
      
      if (parsed.actions && Array.isArray(parsed.actions)) {
        const actions = parsed.actions as RealtimeAction[];
        
        // Exécuter chaque action
        actions.forEach((action: RealtimeAction) => {
          console.log('🎯 Action exécutée:', action);
          onAction?.(action);
        });
        
        // Notifier toutes les actions extraites
        onActionsExtracted?.(actions);
        
        updateState({ actions: [...state.actions, ...actions] });
        
        // Message de confirmation
        const actionCount = actions.length;
        const message = actionCount > 0 
          ? `✓ ${actionCount} action${actionCount > 1 ? 's' : ''} exécutée${actionCount > 1 ? 's' : ''}`
          : '⚠️ Aucune action détectée';
        
        onResponse?.(message);
        return message;
      }
      
      // Si pas d'actions mais un message parlé (ancien format)
      if (parsed.spoken) {
        onResponse?.(parsed.spoken);
        return parsed.spoken;
      }
      
      return '⚠️ Format de réponse non reconnu';
    } catch (err) {
      console.error('Erreur parsing réponse:', err, 'Texte:', text);
      onResponse?.('⚠️ Erreur de traitement');
      return '⚠️ Erreur de traitement';
    }
  }, [onAction, onResponse, onActionsExtracted, state.actions, updateState]);

  // Gérer les messages WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'session.created':
          console.log('✅ Session Realtime créée');
          updateState({ isConnected: true, isConnecting: false, error: null });
          break;

        case 'session.updated':
          console.log('✅ Session configurée (mode silencieux)');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 Parole détectée');
          updateState({ isSpeaking: true });
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🎤 Fin de parole - traitement...');
          updateState({ isSpeaking: false, isProcessing: true });
          break;

        case 'conversation.item.input_audio_transcription.completed':
          const transcript = data.transcript;
          if (transcript) {
            console.log('📝 Transcription:', transcript);
            updateState({ transcript });
            onTranscript?.(transcript);
          }
          break;

        case 'response.text.delta':
          // Accumuler le texte de la réponse
          if (data.delta) {
            responseTextRef.current += data.delta;
          }
          break;

        case 'response.text.done':
          // Réponse texte complète
          const responseText = data.text || responseTextRef.current;
          if (responseText) {
            console.log('📤 Réponse reçue:', responseText);
            const result = executeActions(responseText);
            updateState({ response: result, isProcessing: false });
          }
          responseTextRef.current = '';
          break;

        case 'response.done':
          console.log('✅ Traitement terminé');
          // Si on a accumulé du texte mais pas encore traité
          if (responseTextRef.current) {
            const result = executeActions(responseTextRef.current);
            updateState({ response: result, isProcessing: false });
            responseTextRef.current = '';
          } else {
            updateState({ isProcessing: false });
          }
          break;

        case 'response.output_item.done':
          // Item de réponse complet
          if (data.item?.content) {
            const textContent = data.item.content.find((c: { type: string; text?: string }) => c.type === 'text');
            if (textContent?.text) {
              console.log('📤 Item réponse:', textContent.text);
              const result = executeActions(textContent.text);
              updateState({ response: result, isProcessing: false });
            }
          }
          break;

        case 'error':
          console.error('❌ Erreur Realtime:', data.error);
          const errorMsg = data.error?.message || 'Erreur inconnue';
          updateState({ error: errorMsg, isProcessing: false });
          onError?.(errorMsg);
          break;

        default:
          // Log pour debug
          if (data.type && !data.type.includes('audio')) {
            console.log('📨 Event:', data.type);
          }
          break;
      }
    } catch (err) {
      console.error('Erreur parsing message:', err);
    }
  }, [onTranscript, onError, executeActions, updateState]);

  // Connecter au WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Déjà connecté');
      return;
    }

    updateState({ isConnecting: true, error: null });

    try {
      // Récupérer la clé API depuis le serveur ou les paramètres locaux
      let key = apiKey;
      
      if (!key) {
        console.log('🔑 Récupération de la clé API depuis le serveur...');
        try {
          const response = await fetch('/api/realtime');
          const data = await response.json();
          
          if (data.success && data.apiKey) {
            key = data.apiKey;
            console.log('✅ Clé API récupérée depuis Vercel');
          } else if (data.error) {
            throw new Error(data.error);
          }
        } catch (fetchError) {
          console.error('❌ Erreur récupération clé API:', fetchError);
          updateState({ 
            error: 'Impossible de récupérer la clé API. Vérifiez la configuration Vercel.', 
            isConnecting: false 
          });
          onError?.('Impossible de récupérer la clé API');
          return;
        }
      }

      if (!key) {
        updateState({ 
          error: 'Clé API OpenAI non disponible', 
          isConnecting: false 
        });
        onError?.('Clé API OpenAI non disponible');
        return;
      }

      console.log('🔌 Connexion à OpenAI Realtime (mode silencieux)...');
      
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      wsRef.current = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${key}`,
        'openai-beta.realtime-v1',
      ]);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connecté');
        
        // Configurer la session en MODE SILENCIEUX (pas d'audio en sortie)
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            // IMPORTANT: Seulement texte en sortie, pas d'audio
            modalities: ['text'],
            instructions: DEVIS_INSTRUCTIONS,
            // Pas de voix en sortie
            voice: 'alloy',
            input_audio_format: 'pcm16',
            // Transcription de l'entrée audio
            input_audio_transcription: {
              model: 'whisper-1',
            },
            // Détection vocale serveur avec paramètres optimisés
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800, // Attendre 800ms de silence
            },
          },
        }));
      };

      wsRef.current.onmessage = handleWebSocketMessage;

      wsRef.current.onerror = (err) => {
        console.error('❌ Erreur WebSocket:', err);
        updateState({ error: 'Erreur de connexion', isConnected: false, isConnecting: false });
        onError?.('Erreur de connexion WebSocket');
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket fermé:', event.code, event.reason);
        updateState({ isConnected: false, isConnecting: false, isListening: false });
      };

    } catch (err) {
      console.error('Erreur connexion:', err);
      updateState({ error: 'Impossible de se connecter', isConnecting: false });
      onError?.('Impossible de se connecter');
    }
  }, [apiKey, handleWebSocketMessage, onError, updateState]);

  // Démarrer l'écoute
  const startListening = useCallback(async () => {
    // Se connecter si pas encore fait
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      // Attendre la connexion
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      updateState({ error: 'Non connecté au serveur' });
      return;
    }

    try {
      // Demander l'accès au micro
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmData = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcmData.buffer as ArrayBuffer);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      updateState({ isListening: true, error: null });
      console.log('🎤 Écoute démarrée (mode silencieux)');

    } catch (err) {
      console.error('Erreur accès micro:', err);
      updateState({ error: 'Impossible d\'accéder au microphone' });
      onError?.('Impossible d\'accéder au microphone');
    }
  }, [connect, floatTo16BitPCM, arrayBufferToBase64, onError, updateState]);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Commiter le buffer audio pour déclencher le traitement
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));
    }

    updateState({ isListening: false });
    console.log('🎤 Écoute arrêtée');
  }, [updateState]);

  // Déconnecter
  const disconnect = useCallback(() => {
    stopListening();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    updateState({ isConnected: false, isConnecting: false, isListening: false });
    console.log('🔌 Déconnecté');
  }, [stopListening, updateState]);

  // Envoyer un message texte (pour test)
  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      updateState({ error: 'Non connecté' });
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));

    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    updateState({ isProcessing: true, transcript: text });
  }, [updateState]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    updateState({
      transcript: '',
      response: '',
      actions: [],
      error: null,
    });
  }, [updateState]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
    reset,
  };
}

export default useRealtimeVoice;
