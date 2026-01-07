'use client';

/**
 * Hook React pour l'API Realtime d'OpenAI
 * Gère la connexion WebSocket, la capture audio et la lecture des réponses
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface RealtimeAction {
  type: 'update_client' | 'add_line' | 'update_line' | 'delete_line' | 'apply_discount' | 'set_object' | 'unknown';
  params?: Record<string, unknown>;
}

export interface RealtimeState {
  isConnected: boolean;
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
}

// Instructions système pour l'assistant vocal professionnel
const DEVIS_INSTRUCTIONS = `Tu es un assistant vocal professionnel destiné à des artisans.
Tu permets de créer, modifier et envoyer des devis et factures en dialoguant oralement.

OBJECTIF PRINCIPAL
- Comprendre le français parlé naturel
- Convertir la voix en intentions métier exploitables
- Permettre une conversation continue (contexte conservé)

COMPORTEMENT GÉNÉRAL
- Tu écoutes les commandes vocales successives
- Tu comprends les corrections, ajouts et modifications
- Tu es tolérant aux hésitations et reformulations orales

RÈGLES STRICTES
- Tu réponds UNIQUEMENT en JSON valide
- Tu n'inventes aucune donnée
- Si une information est manquante, tu la demandes explicitement

DÉPARTEMENTS DOM-TOM (TVA):
- 971: Guadeloupe (8.5%)
- 972: Martinique (8.5%)
- 973: Guyane (0%)
- 974: La Réunion (8.5%)
- 976: Mayotte (0%)

FORMAT DE RÉPONSE JSON:
{
  "spoken": "Message vocal à dire à l'utilisateur",
  "actions": [
    {"type": "update_client", "params": {"nom": "...", "prenom": "...", "adresse": "...", "ville": "...", "department": "972"}},
    {"type": "add_line", "params": {"designation": "...", "quantite": 1, "prixUnitaireHT": 0, "unite": "u"}},
    {"type": "update_line", "params": {"index": -1, "field": "quantite", "value": 3}},
    {"type": "delete_line", "params": {"index": -1}},
    {"type": "apply_discount", "params": {"type": "percent", "value": 10}},
    {"type": "set_object", "params": {"objet": "..."}}
  ]
}

EXEMPLES:
- "Le client c'est Jean Dupont" → {"spoken": "Client défini : Jean Dupont", "actions": [{"type": "update_client", "params": {"nom": "Dupont", "prenom": "Jean"}}]}
- "Ajoute climatisation 2500 euros" → {"spoken": "Climatisation ajoutée à 2500 euros", "actions": [{"type": "add_line", "params": {"designation": "Climatisation", "quantite": 1, "prixUnitaireHT": 2500, "unite": "u"}}]}
- "Non mets plutôt 3" → {"spoken": "Quantité modifiée : 3", "actions": [{"type": "update_line", "params": {"index": -1, "field": "quantite", "value": 3}}]}
- "Remise 10 pourcent" → {"spoken": "Remise de 10% appliquée", "actions": [{"type": "apply_discount", "params": {"type": "percent", "value": 10}}]}
- "Supprime la dernière ligne" → {"spoken": "Ligne supprimée", "actions": [{"type": "delete_line", "params": {"index": -1}}]}

VILLES DOM CONNUES:
- Fort-de-France, Le Lamentin → 972 (Martinique)
- Pointe-à-Pitre, Les Abymes → 971 (Guadeloupe)
- Cayenne, Kourou → 973 (Guyane)
- Saint-Denis, Saint-Pierre → 974 (La Réunion)

STYLE:
- Sois bref et efficace dans le champ "spoken"
- Confirme chaque action
- Demande les informations manquantes poliment`;

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const { apiKey, onAction, onTranscript, onResponse, onError } = options;

  // État
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
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
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

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

  // Base64 vers ArrayBuffer
  const base64ToArrayBuffer = useCallback((base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  // Jouer l'audio de la réponse
  const playAudioChunk = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      const int16Array = new Int16Array(arrayBuffer);
      
      // Convertir PCM16 en Float32
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();

    } catch (err) {
      console.error('Erreur lecture audio:', err);
    }
  }, [base64ToArrayBuffer]);

  // Traiter la queue audio
  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      if (chunk) {
        await playAudioChunk(chunk);
      }
    }
    isPlayingRef.current = false;
  }, [playAudioChunk]);

  // Parser la réponse JSON de l'assistant
  const parseAssistantResponse = useCallback((text: string) => {
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(text);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        parsed.actions.forEach((action: RealtimeAction) => {
          updateState({ actions: [...state.actions, action] });
          onAction?.(action);
        });
      }
      if (parsed.spoken) {
        onResponse?.(parsed.spoken);
        return parsed.spoken;
      }
    } catch {
      // Si pas JSON, c'est du texte simple
      onResponse?.(text);
    }
    return text;
  }, [onAction, onResponse, state.actions, updateState]);

  // Gérer les messages WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'session.created':
          console.log('✅ Session Realtime créée');
          updateState({ isConnected: true, error: null });
          break;

        case 'session.updated':
          console.log('✅ Session mise à jour');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 Parole détectée');
          updateState({ isSpeaking: true });
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🎤 Fin de parole');
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

        case 'response.audio_transcript.delta':
          // Transcript partiel de la réponse
          break;

        case 'response.audio_transcript.done':
          const responseText = data.transcript;
          if (responseText) {
            console.log('💬 Réponse:', responseText);
            const parsed = parseAssistantResponse(responseText);
            updateState({ response: parsed, isProcessing: false });
          }
          break;

        case 'response.audio.delta':
          // Chunk audio de la réponse
          if (data.delta) {
            audioQueueRef.current.push(data.delta);
            processAudioQueue();
          }
          break;

        case 'response.done':
          console.log('✅ Réponse complète');
          updateState({ isProcessing: false });
          break;

        case 'error':
          console.error('❌ Erreur Realtime:', data.error);
          const errorMsg = data.error?.message || 'Erreur inconnue';
          updateState({ error: errorMsg, isProcessing: false });
          onError?.(errorMsg);
          break;

        default:
          // Autres événements ignorés
          break;
      }
    } catch (err) {
      console.error('Erreur parsing message:', err);
    }
  }, [onTranscript, onError, parseAssistantResponse, processAudioQueue, updateState]);

  // Connecter au WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Déjà connecté');
      return;
    }

    const key = apiKey;
    if (!key) {
      updateState({ error: 'Clé API OpenAI non configurée' });
      onError?.('Clé API OpenAI non configurée');
      return;
    }

    try {
      console.log('🔌 Connexion à OpenAI Realtime...');
      
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      wsRef.current = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${key}`,
        'openai-beta.realtime-v1',
      ]);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connecté');
        
        // Configurer la session
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: DEVIS_INSTRUCTIONS,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
          },
        }));
      };

      wsRef.current.onmessage = handleWebSocketMessage;

      wsRef.current.onerror = (err) => {
        console.error('❌ Erreur WebSocket:', err);
        updateState({ error: 'Erreur de connexion', isConnected: false });
        onError?.('Erreur de connexion WebSocket');
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket fermé:', event.code, event.reason);
        updateState({ isConnected: false, isListening: false });
      };

    } catch (err) {
      console.error('Erreur connexion:', err);
      updateState({ error: 'Impossible de se connecter' });
      onError?.('Impossible de se connecter');
    }
  }, [apiKey, handleWebSocketMessage, onError, updateState]);

  // Démarrer l'écoute
  const startListening = useCallback(async () => {
    // Se connecter si pas encore fait
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      // Attendre la connexion
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      console.log('🎤 Écoute démarrée');

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

    updateState({ isConnected: false, isListening: false });
    console.log('🔌 Déconnecté');
  }, [stopListening, updateState]);

  // Envoyer un message texte
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
    updateState({ isProcessing: true });
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
