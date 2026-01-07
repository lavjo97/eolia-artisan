/**
 * Eolia Mobile - Assistant Vocal Devis/Factures
 * Application Expo avec streaming audio vers OpenAI Realtime API
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { convertFloat32ToPCM16Base64, playBase64Audio } from './audioUtils';

// Configuration - Remplacer par l'IP de votre serveur
const WS_URL = Platform.select({
  ios: 'ws://localhost:8080',
  android: 'ws://10.0.2.2:8080', // Émulateur Android
  default: 'ws://localhost:8080',
});

export default function App() {
  // États
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastIntent, setLastIntent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  // Données du devis
  const [devis, setDevis] = useState({
    client: { name: '', address: '' },
    lines: [],
    discount: { type: null, value: 0 },
    total: 0,
  });

  // Références
  const wsRef = useRef(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  // Logger
  const log = useCallback((type, message) => {
    const entry = {
      time: new Date().toLocaleTimeString('fr-FR'),
      type,
      message,
    };
    console.log(`[${type}] ${message}`);
    setLogs(prev => [...prev.slice(-30), entry]);
  }, []);

  // Demander permissions audio
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire.');
        return false;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      return true;
    } catch (err) {
      log('error', `Erreur permissions: ${err.message}`);
      return false;
    }
  };

  // Connexion WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    log('info', 'Connexion au serveur...');
    
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      log('success', 'Connecté au serveur');
      wsRef.current = ws;
      ws.send(JSON.stringify({ type: 'start' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        log('error', `Erreur parsing: ${err.message}`);
      }
    };

    ws.onerror = (err) => {
      log('error', 'Erreur WebSocket');
      setError('Erreur de connexion');
    };

    ws.onclose = () => {
      log('info', 'Déconnecté');
      setIsConnected(false);
      setIsListening(false);
      wsRef.current = null;
    };
  }, [log]);

  // Gérer les messages du serveur
  const handleServerMessage = useCallback(async (data) => {
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
        log('info', `📝 "${data.text}"`);
        setTranscript(data.text);
        break;

      case 'intent':
        log('success', `🎯 ${data.intent.action}`);
        setLastIntent(data.intent);
        applyIntent(data.intent);
        break;

      case 'audio_delta':
        await playBase64Audio(data.audio);
        break;

      case 'error':
        log('error', data.error);
        setError(data.error);
        break;
    }
  }, [log]);

  // Appliquer l'intention
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
          break;

        case 'delete_line':
          let delIdx = intent.params?.line_index;
          if (delIdx === -1) delIdx = prev.lines.length - 1;
          if (delIdx >= 0 && delIdx < prev.lines.length) {
            updated.lines = prev.lines.filter((_, i) => i !== delIdx);
          }
          break;

        case 'set_client':
          updated.client = { ...prev.client, ...intent.params };
          break;

        case 'set_discount':
          updated.discount = {
            type: intent.params?.type || 'percent',
            value: intent.params?.value || 0,
          };
          break;

        case 'create_quote':
        case 'create_invoice':
          updated.lines = [];
          updated.discount = { type: null, value: 0 };
          break;
      }

      // Recalculer le total
      const subtotal = updated.lines.reduce((sum, l) => sum + (l.total || 0), 0);
      if (updated.discount.type === 'percent') {
        updated.total = subtotal * (1 - updated.discount.value / 100);
      } else if (updated.discount.type === 'amount') {
        updated.total = subtotal - updated.discount.value;
      } else {
        updated.total = subtotal;
      }

      return updated;
    });
  }, []);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      log('info', 'Démarrage enregistrement...');

      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 384000,
        },
      });

      // Streaming audio toutes les 100ms
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // On peut utiliser le niveau audio pour feedback visuel
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      log('success', '🎤 Écoute active');

      // Envoyer l'audio périodiquement
      startAudioStreaming(recording);

    } catch (err) {
      log('error', `Erreur enregistrement: ${err.message}`);
      setError(err.message);
    }
  };

  // Streaming audio
  const startAudioStreaming = async (recording) => {
    const streamInterval = setInterval(async () => {
      if (!recordingRef.current || !wsRef.current) {
        clearInterval(streamInterval);
        return;
      }

      try {
        const uri = recording.getURI();
        if (uri) {
          // Lire et envoyer l'audio
          const response = await fetch(uri);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              const base64 = reader.result.split(',')[1];
              wsRef.current.send(JSON.stringify({
                type: 'audio',
                audio: base64,
              }));
            }
          };
          
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        // Ignorer les erreurs de streaming
      }
    }, 250);

    // Stocker l'interval pour le cleanup
    recordingRef.current._streamInterval = streamInterval;
  };

  // Arrêter l'enregistrement
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Arrêter le streaming
      if (recordingRef.current._streamInterval) {
        clearInterval(recordingRef.current._streamInterval);
      }

      await recordingRef.current.stopAndUnloadAsync();
      
      // Envoyer le dernier audio et commit
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'commit_audio' }));
      }

      recordingRef.current = null;
      setIsListening(false);
      log('info', '🎤 Arrêté');

    } catch (err) {
      log('error', `Erreur arrêt: ${err.message}`);
    }
  };

  // Toggle écoute
  const toggleListening = async () => {
    if (isListening) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎤 Eolia Voice</Text>
        <Text style={styles.subtitle}>Assistant vocal devis & factures</Text>
      </View>

      {/* Bouton Micro */}
      <View style={styles.micSection}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening ? styles.micListening : styles.micIdle,
          ]}
          onPress={toggleListening}
          activeOpacity={0.8}
        >
          <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
        </TouchableOpacity>

        <View style={[
          styles.statusBadge,
          isConnected ? styles.statusConnected : styles.statusDisconnected,
        ]}>
          <Text style={styles.statusText}>
            {!isConnected && '⚪ Déconnecté'}
            {isConnected && !isListening && '🟢 Prêt'}
            {isConnected && isListening && !isSpeaking && '🔴 Écoute...'}
            {isConnected && isListening && isSpeaking && '🎤 Parole...'}
          </Text>
        </View>
      </View>

      {/* Erreur */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Transcription */}
      {transcript && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>📝 Vous avez dit:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {/* Dernière intention */}
      {lastIntent && (
        <View style={styles.intentBox}>
          <Text style={styles.intentLabel}>🎯 Action: {lastIntent.action}</Text>
          {lastIntent.message && (
            <Text style={styles.intentMessage}>{lastIntent.message}</Text>
          )}
        </View>
      )}

      {/* Aperçu Devis */}
      <View style={styles.devisCard}>
        <Text style={styles.cardTitle}>📋 Devis</Text>

        {devis.client.name && (
          <Text style={styles.clientText}>👤 {devis.client.name}</Text>
        )}

        <ScrollView style={styles.linesList}>
          {devis.lines.length === 0 ? (
            <Text style={styles.emptyText}>
              Dites "Ajoute..." pour commencer
            </Text>
          ) : (
            devis.lines.map((line, idx) => (
              <View key={line.id} style={styles.lineItem}>
                <Text style={styles.lineNumber}>{idx + 1}.</Text>
                <View style={styles.lineContent}>
                  <Text style={styles.lineDesignation}>{line.designation}</Text>
                  <Text style={styles.linePrice}>
                    {line.quantity} × {line.unit_price}€ = {line.total.toFixed(2)}€
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {devis.discount.value > 0 && (
          <Text style={styles.discountText}>
            💰 Remise: -{devis.discount.type === 'percent' 
              ? `${devis.discount.value}%` 
              : `${devis.discount.value}€`}
          </Text>
        )}

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>
            Total: {devis.total.toFixed(2)} €
          </Text>
        </View>
      </View>

      {/* Logs */}
      <View style={styles.logsCard}>
        <Text style={styles.cardTitle}>📊 Journal</Text>
        <ScrollView style={styles.logsList}>
          {logs.slice(-10).map((log, i) => (
            <Text
              key={i}
              style={[
                styles.logEntry,
                log.type === 'error' && styles.logError,
                log.type === 'success' && styles.logSuccess,
              ]}
            >
              [{log.time}] {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00d4ff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  micSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  micIdle: {
    backgroundColor: '#7b2ff7',
  },
  micListening: {
    backgroundColor: '#ff4444',
  },
  micIcon: {
    fontSize: 40,
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusConnected: {
    backgroundColor: 'rgba(0,200,83,0.2)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
  transcriptBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  transcriptLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  transcriptText: {
    color: 'white',
    fontSize: 16,
  },
  intentBox: {
    backgroundColor: 'rgba(0,200,83,0.2)',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  intentLabel: {
    color: '#69f0ae',
    fontWeight: '600',
  },
  intentMessage: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontSize: 14,
  },
  devisCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    maxHeight: 200,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  clientText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  linesList: {
    maxHeight: 80,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  lineItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lineNumber: {
    color: 'rgba(255,255,255,0.5)',
    width: 24,
  },
  lineContent: {
    flex: 1,
  },
  lineDesignation: {
    color: 'white',
    fontSize: 14,
  },
  linePrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  discountText: {
    color: '#69f0ae',
    textAlign: 'right',
    marginTop: 8,
  },
  totalBox: {
    backgroundColor: 'rgba(0,212,255,0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  totalText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  logsCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  logsList: {
    flex: 1,
  },
  logEntry: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 2,
  },
  logError: {
    color: '#ff6b6b',
  },
  logSuccess: {
    color: '#69f0ae',
  },
});
