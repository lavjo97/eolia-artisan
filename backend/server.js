/**
 * Backend Realtime API OpenAI
 * Serveur WebSocket pour la gestion vocale de devis/factures
 */

require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');

// Configuration
const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

// Prompt système pour l'assistant vocal professionnel
const SYSTEM_PROMPT = `Tu es un assistant vocal professionnel destiné à des artisans.
Tu permets de créer, modifier et envoyer des devis et factures en dialoguant oralement.

OBJECTIF PRINCIPAL:
- Comprendre le français parlé naturel
- Convertir la voix en intentions métier exploitables
- Permettre une conversation continue (contexte conservé)

RÈGLES STRICTES:
- Tu réponds UNIQUEMENT en JSON valide
- Tu n'inventes aucune donnée
- Si une information est manquante, utilise ask_missing_info
- Tu es tolérant aux hésitations et reformulations orales

DÉPARTEMENTS DOM-TOM (TVA spécifique):
- 971: Guadeloupe (8.5%)
- 972: Martinique (8.5%)
- 973: Guyane (0%)
- 974: La Réunion (8.5%)
- 976: Mayotte (0%)

ACTIONS DISPONIBLES:
- create_quote: Créer un nouveau devis
- create_invoice: Créer une nouvelle facture
- add_line: Ajouter une ligne (designation, quantity, unit_price, unit)
- update_line: Modifier une ligne existante (line_index, field, value)
- delete_line: Supprimer une ligne (line_index: -1 pour dernière)
- set_client: Définir le client (name, firstName, address, city, department, phone, email)
- set_discount: Appliquer une remise (type: percent|amount, value)
- remove_discount: Supprimer la remise
- send_document: Envoyer le document (method: email|whatsapp|sms, recipient)
- ask_missing_info: Demander une information manquante (field, question)
- cancel_action: Annuler l'action en cours

FORMAT DE RÉPONSE JSON:
{
  "action": "nom_action",
  "params": { ... },
  "message": "Message vocal à dire à l'utilisateur",
  "requires_confirmation": false
}

EXEMPLES:
- "Ajoute une climatisation à 2500 euros" → {"action":"add_line","params":{"designation":"Climatisation","quantity":1,"unit_price":2500,"unit":"u"},"message":"Climatisation ajoutée à 2500 euros."}
- "Le client c'est Jean Dupont" → {"action":"set_client","params":{"name":"Dupont","firstName":"Jean"},"message":"Client défini: Jean Dupont."}
- "Non mets plutôt 3" → {"action":"update_line","params":{"line_index":-1,"field":"quantity","value":3},"message":"Quantité modifiée: 3."}
- "Remise 10 pourcent" → {"action":"set_discount","params":{"type":"percent","value":10},"message":"Remise de 10% appliquée."}
- "Supprime la dernière ligne" → {"action":"delete_line","params":{"line_index":-1},"message":"Ligne supprimée.","requires_confirmation":true}

VILLES DOM CONNUES:
- Fort-de-France, Le Lamentin → 972 (Martinique)
- Pointe-à-Pitre, Les Abymes → 971 (Guadeloupe)
- Cayenne, Kourou → 973 (Guyane)
- Saint-Denis, Saint-Pierre → 974 (La Réunion)

STYLE:
- Sois bref et efficace dans les messages
- Confirme chaque action
- Demande les informations manquantes poliment`;

// Créer le serveur HTTP
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', openai_configured: !!OPENAI_API_KEY }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

console.log('🚀 Serveur WebSocket démarré');

// Gestion des connexions client
wss.on('connection', (clientWs, req) => {
  const clientId = Date.now().toString(36);
  console.log(`\n👤 [${clientId}] Nouveau client connecté`);

  let openaiWs = null;
  let isOpenAIConnected = false;

  // Vérifier la clé API
  if (!OPENAI_API_KEY) {
    console.error(`❌ [${clientId}] OPENAI_API_KEY non configurée`);
    clientWs.send(JSON.stringify({
      type: 'error',
      error: 'OPENAI_API_KEY non configurée sur le serveur'
    }));
    clientWs.close();
    return;
  }

  // Connecter à OpenAI Realtime API
  function connectToOpenAI() {
    console.log(`🔌 [${clientId}] Connexion à OpenAI Realtime API...`);

    openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    openaiWs.on('open', () => {
      console.log(`✅ [${clientId}] Connecté à OpenAI`);
      isOpenAIConnected = true;

      // Configurer la session
      openaiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: SYSTEM_PROMPT,
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

      // Notifier le client
      clientWs.send(JSON.stringify({
        type: 'connected',
        message: 'Connecté à l\'assistant vocal'
      }));
    });

    openaiWs.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        handleOpenAIEvent(event);
      } catch (err) {
        console.error(`❌ [${clientId}] Erreur parsing OpenAI:`, err);
      }
    });

    openaiWs.on('error', (err) => {
      console.error(`❌ [${clientId}] Erreur OpenAI WebSocket:`, err.message);
      clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Erreur de connexion OpenAI'
      }));
    });

    openaiWs.on('close', (code, reason) => {
      console.log(`🔌 [${clientId}] OpenAI déconnecté: ${code} ${reason}`);
      isOpenAIConnected = false;
    });
  }

  // Gérer les événements OpenAI
  function handleOpenAIEvent(event) {
    switch (event.type) {
      case 'session.created':
        console.log(`📋 [${clientId}] Session OpenAI créée`);
        break;

      case 'session.updated':
        console.log(`📋 [${clientId}] Session mise à jour`);
        break;

      case 'input_audio_buffer.speech_started':
        console.log(`🎤 [${clientId}] Parole détectée`);
        clientWs.send(JSON.stringify({ type: 'speech_started' }));
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log(`🎤 [${clientId}] Fin de parole`);
        clientWs.send(JSON.stringify({ type: 'speech_stopped' }));
        break;

      case 'conversation.item.input_audio_transcription.completed':
        const transcript = event.transcript;
        console.log(`📝 [${clientId}] Transcription: "${transcript}"`);
        clientWs.send(JSON.stringify({
          type: 'transcript',
          text: transcript
        }));
        break;

      case 'response.audio_transcript.delta':
        // Transcript de la réponse en cours
        clientWs.send(JSON.stringify({
          type: 'response_transcript_delta',
          delta: event.delta
        }));
        break;

      case 'response.audio_transcript.done':
        console.log(`💬 [${clientId}] Réponse: "${event.transcript}"`);
        
        // Essayer de parser le JSON de l'intention
        try {
          const intent = JSON.parse(event.transcript);
          console.log(`🎯 [${clientId}] Intention:`, JSON.stringify(intent, null, 2));
          clientWs.send(JSON.stringify({
            type: 'intent',
            intent: intent
          }));
        } catch {
          // Si ce n'est pas du JSON, envoyer comme texte
          clientWs.send(JSON.stringify({
            type: 'response_text',
            text: event.transcript
          }));
        }
        break;

      case 'response.audio.delta':
        // Audio de la réponse
        clientWs.send(JSON.stringify({
          type: 'audio_delta',
          audio: event.delta
        }));
        break;

      case 'response.audio.done':
        clientWs.send(JSON.stringify({ type: 'audio_done' }));
        break;

      case 'response.done':
        console.log(`✅ [${clientId}] Réponse complète`);
        clientWs.send(JSON.stringify({ type: 'response_done' }));
        break;

      case 'error':
        console.error(`❌ [${clientId}] Erreur OpenAI:`, event.error);
        clientWs.send(JSON.stringify({
          type: 'error',
          error: event.error?.message || 'Erreur OpenAI'
        }));
        break;

      default:
        // Log des événements non gérés (debug)
        if (process.env.DEBUG) {
          console.log(`📨 [${clientId}] Event: ${event.type}`);
        }
    }
  }

  // Gérer les messages du client
  clientWs.on('message', (data) => {
    try {
      // Vérifier si c'est du binaire (audio)
      if (Buffer.isBuffer(data)) {
        if (isOpenAIConnected && openaiWs) {
          // Convertir en base64 et envoyer à OpenAI
          const base64Audio = data.toString('base64');
          openaiWs.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
        return;
      }

      // Sinon c'est du JSON
      const message = JSON.parse(data.toString());
      console.log(`📩 [${clientId}] Message client:`, message.type);

      switch (message.type) {
        case 'start':
          connectToOpenAI();
          break;

        case 'stop':
          if (openaiWs) {
            openaiWs.close();
            openaiWs = null;
          }
          clientWs.send(JSON.stringify({ type: 'stopped' }));
          break;

        case 'audio':
          // Audio en base64
          if (isOpenAIConnected && openaiWs && message.audio) {
            openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: message.audio
            }));
          }
          break;

        case 'commit_audio':
          // Forcer le traitement de l'audio en attente
          if (isOpenAIConnected && openaiWs) {
            openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.commit'
            }));
          }
          break;

        case 'text':
          // Envoyer un message texte
          if (isOpenAIConnected && openaiWs && message.text) {
            openaiWs.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: message.text }]
              }
            }));
            openaiWs.send(JSON.stringify({ type: 'response.create' }));
          }
          break;

        case 'cancel':
          // Annuler la réponse en cours
          if (isOpenAIConnected && openaiWs) {
            openaiWs.send(JSON.stringify({ type: 'response.cancel' }));
          }
          break;

        default:
          console.log(`⚠️ [${clientId}] Type de message inconnu: ${message.type}`);
      }

    } catch (err) {
      console.error(`❌ [${clientId}] Erreur message client:`, err);
    }
  });

  // Déconnexion du client
  clientWs.on('close', () => {
    console.log(`👋 [${clientId}] Client déconnecté`);
    if (openaiWs) {
      openaiWs.close();
    }
  });

  clientWs.on('error', (err) => {
    console.error(`❌ [${clientId}] Erreur client WebSocket:`, err);
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎤 Eolia Realtime Voice Server                          ║
║                                                            ║
║   WebSocket: ws://localhost:${PORT}                          ║
║   Health:    http://localhost:${PORT}/health                 ║
║                                                            ║
║   OpenAI Key: ${OPENAI_API_KEY ? '✅ Configurée' : '❌ Non configurée'}                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  if (!OPENAI_API_KEY) {
    console.log('⚠️  Définissez OPENAI_API_KEY pour activer l\'API Realtime');
    console.log('   export OPENAI_API_KEY=sk-...');
  }
});
