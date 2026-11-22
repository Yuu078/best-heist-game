// audio.js — every sound in the museum is synthesised with WebAudio: no
// files, no samples. A coin's clink, a case's chime, the EMP's crack, the
// alarm's rising chirp and the two little tunes for caught and clear. The
// context wakes on the player's first key or click, as browsers require.

export function createAudio() {
  let ctx = null;

  function wake() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** One oscillator note with a quick envelope; `slideTo` bends its pitch. */
  function tone(freq, seconds, { type = 'sine', gain = 0.12, slideTo = null, delay = 0 } = {}) {
    const ac = wake();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    wake,
    coinLand() { tone(2093, 0.09, { type: 'triangle', gain: 0.16 }); tone(2637, 0.14, { type: 'triangle', gain: 0.12, delay: 0.055 }); },
    pickup() { tone(1319, 0.1, { type: 'sine', gain: 0.14 }); tone(1760, 0.16, { type: 'sine', gain: 0.12, delay: 0.07 }); },
    scarab() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.16, { type: 'triangle', gain: 0.13, delay: i * 0.07 })); },
    emp() { tone(2400, 0.28, { type: 'sawtooth', gain: 0.07, slideTo: 120 }); },
    alarmChirp() { tone(1568, 0.07, { type: 'square', gain: 0.045 }); },
    caught() { tone(392, 0.22, { type: 'sawtooth', gain: 0.1 }); tone(311, 0.26, { type: 'sawtooth', gain: 0.1, delay: 0.18 }); tone(233, 0.44, { type: 'sawtooth', gain: 0.11, delay: 0.38 }); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: 'triangle', gain: 0.12, delay: i * 0.09 })); },
  };
}
