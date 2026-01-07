/**
 * Utilitaires audio pour la conversion PCM16
 * Compatible avec l'API Realtime OpenAI
 */

/**
 * Convertit un buffer Float32 en PCM16
 * L'API OpenAI Realtime attend du PCM16 little-endian
 * @param {Float32Array} float32Array - Audio Float32 du navigateur
 * @returns {Int16Array} - Audio PCM16
 */
export function convertFloat32ToPCM16(float32Array) {
  const pcm16 = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp entre -1 et 1
    let sample = Math.max(-1, Math.min(1, float32Array[i]));
    // Convertir en 16-bit
    pcm16[i] = sample < 0 
      ? sample * 0x8000 
      : sample * 0x7FFF;
  }
  
  return pcm16;
}

/**
 * Convertit un buffer PCM16 en Float32
 * Pour la lecture audio dans le navigateur
 * @param {Int16Array} pcm16Array - Audio PCM16
 * @returns {Float32Array} - Audio Float32
 */
export function convertPCM16ToFloat32(pcm16Array) {
  const float32 = new Float32Array(pcm16Array.length);
  
  for (let i = 0; i < pcm16Array.length; i++) {
    float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7FFF);
  }
  
  return float32;
}

/**
 * Décode un buffer base64 en ArrayBuffer
 * @param {string} base64 - Chaîne base64
 * @returns {ArrayBuffer} - Buffer binaire
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Encode un ArrayBuffer en base64
 * @param {ArrayBuffer} buffer - Buffer binaire
 * @returns {string} - Chaîne base64
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Joue de l'audio PCM16 encodé en base64
 * @param {AudioContext} audioContext - Contexte audio Web
 * @param {string} base64Audio - Audio PCM16 en base64
 * @returns {Promise<void>}
 */
export async function playPCM16Audio(audioContext, base64Audio) {
  return new Promise((resolve, reject) => {
    try {
      // Décoder le base64
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      const pcm16 = new Int16Array(arrayBuffer);
      
      // Convertir en Float32
      const float32 = convertPCM16ToFloat32(pcm16);
      
      // Créer le buffer audio
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      
      // Créer et jouer la source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => resolve();
      source.start();
      
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Resample audio d'une fréquence à une autre
 * @param {Float32Array} audioData - Données audio
 * @param {number} fromSampleRate - Fréquence source
 * @param {number} toSampleRate - Fréquence cible
 * @returns {Float32Array} - Audio resampleé
 */
export function resampleAudio(audioData, fromSampleRate, toSampleRate) {
  if (fromSampleRate === toSampleRate) {
    return audioData;
  }
  
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    // Interpolation linéaire
    result[i] = audioData[srcIndexFloor] * (1 - fraction) + 
                audioData[srcIndexCeil] * fraction;
  }
  
  return result;
}

/**
 * Crée un worklet audio pour le streaming
 * Alternative moderne à ScriptProcessorNode
 * @param {AudioContext} audioContext 
 * @param {function} onAudioData - Callback appelé avec les données audio
 */
export async function createAudioWorklet(audioContext, onAudioData) {
  // Code du worklet en tant que Blob
  const workletCode = `
    class AudioStreamProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.buffer = [];
        this.bufferSize = 4096;
      }

      process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input[0]) {
          // Accumuler les samples
          this.buffer.push(...input[0]);
          
          // Envoyer quand le buffer est plein
          if (this.buffer.length >= this.bufferSize) {
            this.port.postMessage({
              audioData: new Float32Array(this.buffer.slice(0, this.bufferSize))
            });
            this.buffer = this.buffer.slice(this.bufferSize);
          }
        }
        return true;
      }
    }

    registerProcessor('audio-stream-processor', AudioStreamProcessor);
  `;

  const blob = new Blob([workletCode], { type: 'application/javascript' });
  const workletUrl = URL.createObjectURL(blob);
  
  await audioContext.audioWorklet.addModule(workletUrl);
  URL.revokeObjectURL(workletUrl);
  
  const workletNode = new AudioWorkletNode(audioContext, 'audio-stream-processor');
  
  workletNode.port.onmessage = (event) => {
    if (event.data.audioData) {
      onAudioData(event.data.audioData);
    }
  };
  
  return workletNode;
}
