// Web Audio API Gentle Sound Synthesizer for Janani Notifications
// Provides soothing, zero-dependency melodic chimes for maternal notifications

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type ChimeType = 'medicine' | 'water' | 'partner' | 'clinical' | 'success';

export function playGentleChime(type: ChimeType = 'medicine', volume: number = 0.4) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.connect(ctx.destination);

    if (type === 'partner') {
      // Warm loving double chord (Major 3rd harmonic swell)
      [523.25, 659.25, 783.99].forEach((freq, i) => { // C5, E5, G5
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        oscGain.gain.setValueAtTime(0, now + i * 0.08);
        oscGain.gain.linearRampToValueAtTime(0.35, now + i * 0.08 + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);

        osc.connect(oscGain);
        oscGain.connect(gainNode);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.85);
      });
    } else if (type === 'water') {
      // Gentle droplet bubble sound
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(oscGain);
      oscGain.connect(gainNode);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'medicine') {
      // Calming two-tone chime (F5 -> A5)
      [698.46, 880.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        oscGain.gain.setValueAtTime(0, now + i * 0.18);
        oscGain.gain.linearRampToValueAtTime(0.3, now + i * 0.18 + 0.04);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.6);

        osc.connect(oscGain);
        oscGain.connect(gainNode);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.65);
      });
    } else if (type === 'clinical') {
      // Gentle alert bell (E5 -> G#5 -> B5)
      [659.25, 830.61, 987.77].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        oscGain.gain.setValueAtTime(0, now + i * 0.12);
        oscGain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.04);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.7);

        osc.connect(oscGain);
        oscGain.connect(gainNode);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.75);
      });
    } else {
      // Success confirmation chime
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18);

      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(oscGain);
      oscGain.connect(gainNode);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    console.debug('Audio chime playback omitted or unsupported:', err);
  }
}

export const playChime = playGentleChime;
