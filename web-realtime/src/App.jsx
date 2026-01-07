import React, { useState, useRef, useCallback, useEffect } from 'react';
import { convertFloat32ToPCM16, playPCM16Audio } from './audioUtils';

// Configuration
const WS_URL = 'ws://localhost:8080';

export default function App() {
  // États
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [lastIntent, setLastIntent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  
  // Données du devis
  const [devis, setDevis] = useState({
    client: { name: '', address: '', phone: '', email: '' },
    lines: [],
    discount: { type: null, value: 0 },
    total: 0,
  });

  // Références
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Logger
  const log = useCallback((type, message, data = null) => {
    const entry = {
      time: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    console.log(`[${entry.type}] ${entry.message}`, data || '');
    setLogs(prev => [...prev.slice(-50), entry]);
  }, []);

  // Connexion WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    log('info', 'Connexion au serveur...');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      log('success', 'Connecté au serveur');
      wsRef.current = ws;
      // Démarrer la session OpenAI
      ws.send(JSON.stringify({ type: 'start' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        log('error', 'Erreur parsing message', err);
      }
    };

    ws.onerror = (err) => {
      log('error', 'Erreur WebSocket', err);
      setError('Erreur de connexion');
    };

    ws.onclose = () => {
      log('info', 'Déconnecté du serveur');
      setIsConnected(false);
      setIsListening(false);
      wsRef.current = null;
    };
  }, [log]);

  // Gérer les messages du serveur
  const handleServerMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        log('success', 'Session OpenAI active');
        setIsConnected(true);
        setError(null);
        break;

      case 'speech_started':
        log('info', '🎤 Parole détectée');
        setIsSpeaking(true);
        break;

      case 'speech_stopped':
        log('info', '🎤 Fin de parole');
        setIsSpeaking(false);
        break;

      case 'transcript':
        log('info', `📝 Vous: "${data.text}"`);
        setTranscript(data.text);
        break;

      case 'response_transcript_delta':
        setResponseText(prev => prev + data.delta);
        break;

      case 'response_text':
        log('info', `💬 Assistant: "${data.text}"`);
        setResponseText(data.text);
        break;

      case 'intent':
        log('success', '🎯 Intention détectée', data.intent);
        setLastIntent(data.intent);
        applyIntent(data.intent);
        break;

      case 'audio_delta':
        // Ajouter l'audio à la queue de lecture
        audioQueueRef.current.push(data.audio);
        playNextAudio();
        break;

      case 'audio_done':
        log('info', '🔊 Audio terminé');
        break;

      case 'response_done':
        setResponseText('');
        break;

      case 'error':
        log('error', data.error);
        setError(data.error);
        break;

      case 'stopped':
        log('info', 'Session arrêtée');
        setIsConnected(false);
        break;

      default:
        log('debug', `Event: ${data.type}`);
    }
  }, [log]);

  // Appliquer l'intention au devis
  const applyIntent = useCallback((intent) => {
    if (!intent?.action) return;

    setDevis(prev => {
      const updated = { ...prev };

      switch (intent.action) {
        case 'add_line':
          const newLine = {
            id: Date.now(),
            designation: intent.params?.designation || 'Article',
            quantity: intent.params?.quantity || 1,
            unit: intent.params?.unit || 'u',
            unit_price: intent.params?.unit_price || 0,
          };
          newLine.total = newLine.quantity * newLine.unit_price;
          updated.lines = [...prev.lines, newLine];
          log('success', `✅ Ligne ajoutée: ${newLine.designation}`);
          break;

        case 'update_line':
          const lineIdx = intent.params?.line_index;
          if (lineIdx !== undefined && prev.lines[lineIdx]) {
            const field = intent.params?.field;
            const value = intent.params?.value;
            updated.lines = prev.lines.map((line, i) => {
              if (i === lineIdx) {
                const newLine = { ...line, [field]: value };
                newLine.total = newLine.quantity * newLine.unit_price;
                return newLine;
              }
              return line;
            });
            log('success', `✅ Ligne ${lineIdx + 1} modifiée`);
          }
          break;

        case 'delete_line':
          let delIdx = intent.params?.line_index;
          if (delIdx === -1) delIdx = prev.lines.length - 1;
          if (delIdx >= 0 && delIdx < prev.lines.length) {
            updated.lines = prev.lines.filter((_, i) => i !== delIdx);
            log('success', `✅ Ligne ${delIdx + 1} supprimée`);
          }
          break;

        case 'set_client':
          updated.client = { ...prev.client, ...intent.params };
          log('success', `✅ Client: ${intent.params?.name || 'mis à jour'}`);
          break;

        case 'set_discount':
          updated.discount = {
            type: intent.params?.type || 'percent',
            value: intent.params?.value || 0,
          };
          log('success', `✅ Remise appliquée`);
          break;

        case 'create_quote':
        case 'create_invoice':
          // Réinitialiser le devis
          updated.lines = [];
          updated.discount = { type: null, value: 0 };
          log('success', `✅ Nouveau ${intent.action === 'create_quote' ? 'devis' : 'facture'}`);
          break;

        default:
          log('info', `Action non gérée: ${intent.action}`);
      }

      // Recalculer le total
      const subtotal = updated.lines.reduce((sum, l) => sum + l.total, 0);
      if (updated.discount.type === 'percent') {
        updated.total = subtotal * (1 - updated.discount.value / 100);
      } else if (updated.discount.type === 'amount') {
        updated.total = subtotal - updated.discount.value;
      } else {
        updated.total = subtotal;
      }

      return updated;
    });
  }, [log]);

  // Lecture audio
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const base64Audio = audioQueueRef.current.shift();

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      await playPCM16Audio(audioContextRef.current, base64Audio);
    } catch (err) {
      console.error('Erreur lecture audio:', err);
    }

    isPlayingRef.current = false;
    playNextAudio();
  }, []);

  // Démarrer l'écoute
  const startListening = useCallback(async () => {
    if (!isConnected) {
      connect();
      return;
    }

    try {
      log('info', 'Demande accès microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);
          wsRef.current.send(pcm16.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsListening(true);
      log('success', '🎤 Écoute active');

    } catch (err) {
      log('error', 'Erreur microphone', err.message);
      setError(`Erreur micro: ${err.message}`);
    }
  }, [isConnected, connect, log]);

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

    setIsListening(false);
    log('info', '🎤 Écoute arrêtée');
  }, [log]);

  // Déconnexion
  const disconnect = useCallback(() => {
    stopListening();
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
    }
  }, [stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
    },
    header: {
      gridColumn: '1 / -1',
      textAlign: 'center',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(to right, #00d4ff, #7b2ff7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
    },
    card: {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    cardTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    button: {
      padding: '1rem 2rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    micButton: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      fontSize: '2.5rem',
      margin: '0 auto',
    },
    listening: {
      background: 'linear-gradient(135deg, #ff4444, #ff6b6b)',
      animation: 'pulse 1.5s infinite',
      boxShadow: '0 0 40px rgba(255,68,68,0.5)',
    },
    notListening: {
      background: 'linear-gradient(135deg, #00d4ff, #7b2ff7)',
      boxShadow: '0 0 20px rgba(0,212,255,0.3)',
    },
    connected: {
      background: 'linear-gradient(135deg, #00c853, #69f0ae)',
    },
    status: {
      textAlign: 'center',
      marginTop: '1rem',
      padding: '0.5rem',
      borderRadius: '8px',
      fontSize: '0.9rem',
    },
    transcriptBox: {
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px',
      padding: '1rem',
      minHeight: '60px',
      marginBottom: '1rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '0.75rem',
      borderBottom: '1px solid rgba(255,255,255,0.2)',
      fontSize: '0.85rem',
      color: 'rgba(255,255,255,0.7)',
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    total: {
      textAlign: 'right',
      fontSize: '1.5rem',
      fontWeight: '700',
      marginTop: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,247,0.2))',
      borderRadius: '8px',
    },
    logs: {
      maxHeight: '200px',
      overflow: 'auto',
      fontSize: '0.8rem',
      fontFamily: 'monospace',
    },
    logEntry: {
      padding: '0.3rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    intent: {
      background: 'rgba(0,200,83,0.2)',
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '1rem',
    },
    intentCode: {
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    },
    error: {
      background: 'rgba(255,68,68,0.2)',
      color: '#ff6b6b',
      padding: '0.75rem',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎤 Eolia Voice</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Assistant vocal pour devis et factures
        </p>
      </header>

      {/* Contrôles */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🎙️ Commandes Vocales</h2>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              ...styles.button,
              ...styles.micButton,
              ...(isListening ? styles.listening : styles.notListening),
            }}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>

          <div style={{
            ...styles.status,
            background: isConnected 
              ? 'rgba(0,200,83,0.2)' 
              : 'rgba(255,255,255,0.1)',
            color: isConnected ? '#69f0ae' : 'rgba(255,255,255,0.7)',
          }}>
            {!isConnected && '⚪ Déconnecté'}
            {isConnected && !isListening && '🟢 Connecté - Cliquez pour parler'}
            {isConnected && isListening && !isSpeaking && '🔴 Écoute en cours...'}
            {isConnected && isListening && isSpeaking && '🎤 Parole détectée...'}
          </div>
        </div>

        {/* Transcription */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
            📝 Transcription
          </h3>
          <div style={styles.transcriptBox}>
            {transcript || <span style={{ color: 'rgba(255,255,255,0.4)' }}>En attente...</span>}
          </div>
        </div>

        {/* Dernière intention */}
        {lastIntent && (
          <div style={styles.intent}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>🎯 Dernière action</h3>
            <code style={styles.intentCode}>
              {JSON.stringify(lastIntent, null, 2)}
            </code>
          </div>
        )}
      </div>

      {/* Aperçu Devis */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 Aperçu du Devis</h2>

        {/* Client */}
        {devis.client.name && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>Client:</strong> {devis.client.name}
            {devis.client.address && <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{devis.client.address}</div>}
          </div>
        )}

        {/* Tableau des lignes */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Désignation</th>
              <th style={styles.th}>Qté</th>
              <th style={styles.th}>P.U.</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lines.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Dites "Ajoute une prestation à X euros"
                </td>
              </tr>
            ) : (
              devis.lines.map((line, idx) => (
                <tr key={line.id}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>{line.designation}</td>
                  <td style={styles.td}>{line.quantity} {line.unit}</td>
                  <td style={styles.td}>{line.unit_price.toFixed(2)} €</td>
                  <td style={styles.td}>{line.total.toFixed(2)} €</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Remise */}
        {devis.discount.value > 0 && (
          <div style={{ textAlign: 'right', marginTop: '0.5rem', color: '#69f0ae' }}>
            Remise: -{devis.discount.type === 'percent' 
              ? `${devis.discount.value}%` 
              : `${devis.discount.value.toFixed(2)} €`}
          </div>
        )}

        {/* Total */}
        <div style={styles.total}>
          Total: {devis.total.toFixed(2)} €
        </div>
      </div>

      {/* Logs */}
      <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
        <h2 style={styles.cardTitle}>📊 Journal</h2>
        <div style={styles.logs}>
          {logs.map((log, i) => (
            <div key={i} style={{
              ...styles.logEntry,
              color: log.type === 'error' ? '#ff6b6b' 
                   : log.type === 'success' ? '#69f0ae' 
                   : 'rgba(255,255,255,0.8)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>[{log.time}]</span> {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
        <h2 style={styles.cardTitle}>💡 Commandes disponibles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>➕ Ajouter</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Ajoute une climatisation à 2500 euros"</p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>✏️ Modifier</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Change le prix de la ligne 1 à 3000 euros"</p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>🗑️ Supprimer</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Supprime la dernière ligne"</p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>👤 Client</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Le client c'est Jean Dupont"</p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>💰 Remise</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Applique une remise de 10 pourcent"</p>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong>📄 Nouveau</strong>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"Crée un nouveau devis"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
