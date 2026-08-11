/**
 * Web Audio API procedural sound synthesizer for Studio Ghibli-themed notification chimes.
 * Does not require external audio assets.
 */

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
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a gentle, warm pentatonic bell chime for task reminders.
 */
export function playGhibliChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C5, E5, G5 notes (523.25 Hz, 659.25 Hz, 783.99 Hz)
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.12);

    // Warm envelope
    gain.gain.setValueAtTime(0, now + index * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + index * 0.12 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.12);
    osc.stop(now + index * 0.12 + 0.85);
  });
}

/**
 * Plays an upbeat, cheerful ascending double chime for task completions.
 */
export function playCompletionChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // E5, A5, C6 (659.25 Hz, 880 Hz, 1046.50 Hz)
  const notes = [659.25, 880, 1046.50];

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // Richer tone for celebration
    osc.frequency.setValueAtTime(freq, now + index * 0.09);

    gain.gain.setValueAtTime(0, now + index * 0.09);
    gain.gain.linearRampToValueAtTime(0.2, now + index * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.09);
    osc.stop(now + index * 0.09 + 0.65);
  });
}
