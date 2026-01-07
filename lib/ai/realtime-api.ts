/**
 * OpenAI Realtime API Service
 * Permet une conversation vocale bidirectionnelle en temps réel
 * Utilise WebSocket pour une communication instantanée
 */

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  instructions?: string;
  inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
}

export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface TranscriptDelta {
  text: string;
  isFinal: boolean;
}

export interface RealtimeCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: TranscriptDelta) => void;
  onResponse?: (text: string) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
}

// Instructions système pour l'assistant de devis
const DEVIS_INSTRUCTIONS = `Tu es un assistant vocal pour la création de devis d'artisans dans les DOM-TOM.

RÔLE:
- Aide l'artisan à créer des devis par la voix
- Comprends le français parlé naturellement
- Réponds de manière concise et claire

ACTIONS POSSIBLES:
1. Remplir les informations client (nom, adresse, téléphone)
2. Ajouter des lignes de prestation (désignation, quantité, prix)
3. Appliquer des remises
4. Modifier ou supprimer des lignes

DÉPARTEMENTS DOM:
- 971: Guadeloupe (TVA 8.5%)
- 972: Martinique (TVA 8.5%)  
- 973: Guyane (TVA 0%)
- 974: La Réunion (TVA 8.5%)
- 976: Mayotte (TVA 0%)

STYLE:
- Sois bref et efficace
- Confirme chaque action
- Si tu ne comprends pas, demande de répéter
- Utilise un ton professionnel mais amical

IMPORTANT: Réponds TOUJOURS en JSON avec ce format:
{
  "spoken": "Message vocal à dire à l'utilisateur",
  "actions": [
    {"type": "update_client|add_line|update_line|delete_line|apply_discount", ...}
  ]
}`;

export class RealtimeAPIService {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private callbacks: RealtimeCallbacks;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(config: RealtimeConfig, callbacks: RealtimeCallbacks = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      instructions: DEVIS_INSTRUCTIONS,
      ...config,
    };
    this.callbacks = callbacks;
  }

  /**
   * Connecte au service Realtime via WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to Realtime API');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
        
        this.ws = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${this.config.apiKey}`,
          'openai-beta.realtime-v1',
        ]);

        this.ws.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Configurer la session
          this.sendEvent({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: this.config.instructions,
              voice: this.config.voice,
              input_audio_format: this.config.inputAudioFormat,
              output_audio_format: this.config.outputAudioFormat,
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
          });

          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.callbacks.onError?.(new Error('Erreur de connexion WebSocket'));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.callbacks.onDisconnected?.();
          
          // Tentative de reconnexion automatique
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Envoie un événement au serveur
   */
  private sendEvent(event: RealtimeEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  /**
   * Gère les messages reçus du serveur
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as RealtimeEvent;
      
      switch (data.type) {
        case 'session.created':
          console.log('Session created:', data);
          break;

        case 'session.updated':
          console.log('Session updated');
          break;

        case 'input_audio_buffer.speech_started':
          this.callbacks.onSpeechStarted?.();
          break;

        case 'input_audio_buffer.speech_stopped':
          this.callbacks.onSpeechStopped?.();
          break;

        case 'conversation.item.input_audio_transcription.completed':
          const transcript = (data as { transcript?: string }).transcript;
          if (transcript) {
            this.callbacks.onTranscript?.({
              text: transcript,
              isFinal: true,
            });
          }
          break;

        case 'response.audio_transcript.delta':
          const delta = (data as { delta?: string }).delta;
          if (delta) {
            this.callbacks.onTranscript?.({
              text: delta,
              isFinal: false,
            });
          }
          break;

        case 'response.audio_transcript.done':
          const finalTranscript = (data as { transcript?: string }).transcript;
          if (finalTranscript) {
            this.callbacks.onResponse?.(finalTranscript);
          }
          break;

        case 'response.audio.delta':
          const audioData = (data as { delta?: string }).delta;
          if (audioData) {
            const binaryData = this.base64ToArrayBuffer(audioData);
            this.callbacks.onAudioData?.(binaryData);
          }
          break;

        case 'response.done':
          console.log('Response complete');
          break;

        case 'error':
          const errorData = data as { error?: { message?: string } };
          console.error('Realtime API error:', errorData.error);
          this.callbacks.onError?.(new Error(errorData.error?.message || 'Unknown error'));
          break;

        default:
          // Ignorer les autres événements
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Démarre la capture audio du microphone
   */
  async startAudioCapture(): Promise<void> {
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!this.isConnected) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64Audio = this.arrayBufferToBase64(pcmData.buffer as ArrayBuffer);

        this.sendEvent({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        });
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

    } catch (error) {
      console.error('Error starting audio capture:', error);
      this.callbacks.onError?.(new Error('Impossible d\'accéder au microphone'));
    }
  }

  /**
   * Arrête la capture audio
   */
  stopAudioCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Envoie un message texte
   */
  sendTextMessage(text: string): void {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    });

    // Demander une réponse
    this.sendEvent({
      type: 'response.create',
    });
  }

  /**
   * Interrompt la réponse en cours
   */
  cancelResponse(): void {
    this.sendEvent({
      type: 'response.cancel',
    });
  }

  /**
   * Déconnecte du service
   */
  disconnect(): void {
    this.stopAudioCapture();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Vérifie si connecté
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  // Utilitaires de conversion audio
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Hook React pour utiliser l'API Realtime
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useRealtimeAPI(config: RealtimeConfig | null) {
  // Ce hook sera implémenté dans le composant
  return null;
}

export default RealtimeAPIService;
