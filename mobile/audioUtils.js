/**
 * Utilitaires audio pour React Native / Expo
 * Conversion et lecture PCM16 pour OpenAI Realtime API
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Convertit Float32 en PCM16 encodé base64
 * @param {Float32Array} float32Array
 * @returns {string} base64
 */
export function convertFloat32ToPCM16Base64(float32Array) {
  const pcm16 = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    let sample = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  
  // Convertir en base64
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Décode base64 en ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Convertit PCM16 en Float32
 * @param {Int16Array} pcm16
 * @returns {Float32Array}
 */
export function convertPCM16ToFloat32(pcm16) {
  const float32 = new Float32Array(pcm16.length);
  
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
  }
  
  return float32;
}

/**
 * Joue de l'audio PCM16 encodé en base64
 * @param {string} base64Audio - Audio PCM16 en base64
 */
export async function playBase64Audio(base64Audio) {
  try {
    // Décoder le base64
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const pcm16 = new Int16Array(arrayBuffer);
    
    // Créer un header WAV
    const wavBuffer = createWavBuffer(pcm16, 24000);
    
    // Écrire dans un fichier temporaire
    const tempUri = FileSystem.cacheDirectory + 'temp_audio_' + Date.now() + '.wav';
    
    // Convertir en base64 pour écriture
    const wavBase64 = arrayBufferToBase64(wavBuffer);
    await FileSystem.writeAsStringAsync(tempUri, wavBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Jouer le fichier
    const { sound } = await Audio.Sound.createAsync({ uri: tempUri });
    await sound.playAsync();
    
    // Cleanup après lecture
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        FileSystem.deleteAsync(tempUri, { idempotent: true });
      }
    });
    
  } catch (err) {
    console.error('Erreur lecture audio:', err);
  }
}

/**
 * Crée un buffer WAV à partir de données PCM16
 * @param {Int16Array} pcm16Data
 * @param {number} sampleRate
 * @returns {ArrayBuffer}
 */
export function createWavBuffer(pcm16Data, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm16Data.length * (bitsPerSample / 8);
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // Header RIFF
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // Chunk fmt
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // Chunk data
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Données audio
  const output = new Int16Array(buffer, 44);
  output.set(pcm16Data);
  
  return buffer;
}

/**
 * Écrit une chaîne dans un DataView
 * @param {DataView} view
 * @param {number} offset
 * @param {string} string
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convertit ArrayBuffer en base64
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Vérifie si l'enregistrement audio est disponible
 * @returns {Promise<boolean>}
 */
export async function isRecordingAvailable() {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
