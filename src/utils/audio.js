// Web Audio API Synthesizer for Tactile Haptic Sound Effects

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && (typeof window !== 'undefined')) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTactileSound(type = 'inc') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (type === 'inc') {
      // Crisp mechanical upward tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } else if (type === 'dec') {
      // Soft mechanical downward thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } else if (type === 'reset') {
      // Low-frequency metallic purge
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    } else if (type === 'macro') {
      // Digital chirping chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'goal') {
      // Fanfare arpeggio chord for goal milestone
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const startTime = now + idx * 0.06;
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, startTime);
        noteGain.gain.setValueAtTime(0.07, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.start(startTime);
        noteOsc.stop(startTime + 0.22);
      });
    }
  } catch {
    // Ignore audio errors gracefully (e.g. autoplay permissions)
  }
}

export function triggerHaptic(duration = 15) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore vibration error if not supported or disabled
    }
  }
}
