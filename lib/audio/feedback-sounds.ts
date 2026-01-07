/**
 * Système de sons de feedback pour les commandes vocales
 * Utilise l'API Web Audio pour générer des bips
 */

type SoundType = 'success' | 'error' | 'start' | 'end' | 'thinking';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  ramp?: boolean;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  // Bip de succès : deux notes montantes (do-mi)
  success: [
    { frequency: 523.25, duration: 100, type: 'sine', volume: 0.3 }, // Do
    { frequency: 659.25, duration: 150, type: 'sine', volume: 0.3 }, // Mi
  ],
  
  // Bip d'erreur : note descendante
  error: [
    { frequency: 400, duration: 100, type: 'square', volume: 0.2 },
    { frequency: 300, duration: 200, type: 'square', volume: 0.2 },
  ],
  
  // Bip de démarrage d'écoute
  start: { frequency: 880, duration: 100, type: 'sine', volume: 0.25, ramp: true },
  
  // Bip de fin d'écoute
  end: { frequency: 440, duration: 100, type: 'sine', volume: 0.2, ramp: true },
  
  // Son de réflexion (pendant le traitement)
  thinking: { frequency: 600, duration: 50, type: 'sine', volume: 0.1 },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

async function playTone(config: SoundConfig): Promise<void> {
  const ctx = getAudioContext();
  
  // Reprendre le contexte si suspendu
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
  
  if (config.ramp) {
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration / 1000);
  } else {
    gainNode.gain.setValueAtTime(config.volume, ctx.currentTime + config.duration / 1000 - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration / 1000);
  }

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + config.duration / 1000 + 0.05);

  return new Promise((resolve) => {
    setTimeout(resolve, config.duration);
  });
}

/**
 * Joue un son de feedback
 */
export async function playFeedbackSound(type: SoundType): Promise<void> {
  try {
    const config = SOUND_CONFIGS[type];
    
    if (Array.isArray(config)) {
      // Jouer une séquence de sons
      for (const tone of config) {
        await playTone(tone);
        await new Promise(resolve => setTimeout(resolve, 50)); // Pause entre les notes
      }
    } else {
      await playTone(config);
    }
  } catch (error) {
    console.warn('Could not play feedback sound:', error);
  }
}

/**
 * Joue le son de succès (commande comprise)
 */
export function playSuccessSound(): void {
  playFeedbackSound('success');
}

/**
 * Joue le son d'erreur (commande non comprise)
 */
export function playErrorSound(): void {
  playFeedbackSound('error');
}

/**
 * Joue le son de démarrage d'écoute
 */
export function playStartSound(): void {
  playFeedbackSound('start');
}

/**
 * Joue le son de fin d'écoute
 */
export function playEndSound(): void {
  playFeedbackSound('end');
}

/**
 * Joue le son de réflexion
 */
export function playThinkingSound(): void {
  playFeedbackSound('thinking');
}

const feedbackSounds = {
  playSuccessSound,
  playErrorSound,
  playStartSound,
  playEndSound,
  playThinkingSound,
  playFeedbackSound,
};

export default feedbackSounds;
