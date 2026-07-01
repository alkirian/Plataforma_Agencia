// Web Audio API Sound Synthesizer for premium interface sounds
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const isMuted = () => {
  return localStorage.getItem('cadence-sound-muted') === 'true';
};

export const setMuted = (muted) => {
  localStorage.setItem('cadence-sound-muted', muted ? 'true' : 'false');
};

const playTone = (freqs, duration = 0.1, type = 'sine', sweep = false) => {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    
    if (sweep && freqs.length >= 2) {
      osc.frequency.setValueAtTime(freqs[0], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
    } else {
      osc.frequency.setValueAtTime(freqs[0], now);
      if (freqs.length > 1) {
        const step = duration / (freqs.length - 1);
        freqs.forEach((f, idx) => {
          osc.frequency.setValueAtTime(f, now + idx * step);
        });
      }
    }
    
    gainNode.gain.setValueAtTime(0.08, now); // Keep it soft and subtle
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.warn('Web Audio playback blocked or failed:', err);
  }
};

// Double soft chime
export const playSuccessSound = () => {
  playTone([659.25, 880], 0.25, 'sine');
};

// Ascending sweep (woosh)
export const playUndoSound = () => {
  playTone([220, 660], 0.35, 'triangle', true);
};

// Subtle click
export const playClickSound = () => {
  playTone([1200, 100], 0.05, 'sine', true);
};
