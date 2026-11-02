/**
 * Utility audio: riproduce i file MP3 personalizzati (/timer-dark.mp3 e /timer-light.mp3)
 * caricati in /public, con fallback automatico sintetizzato Web Audio API.
 */

function playSynthesizedSound(theme = 'dark') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (theme === 'dark') {
      // Suono arcade tipo laser blast retro 8-bit ("pew-pew-pew!")
      const now = ctx.currentTime;
      [0, 0.10, 0.20].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        const startFreq = 1600 - idx * 250;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(110, now + offset + 0.085);

        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else {
      // Suono classico campanella pulito e brillante
      const now = ctx.currentTime;
      const fundamental = 880; // La5
      const harmonics = [
        { f: fundamental, g: 0.35, d: 1.4 },
        { f: fundamental * 1.5, g: 0.22, d: 1.0 },
        { f: fundamental * 2.03, g: 0.15, d: 0.8 },
        { f: fundamental * 2.76, g: 0.08, d: 0.5 }
      ];

      harmonics.forEach(({ f, g, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(g, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + d + 0.05);
      });
    }
  } catch (err) {
    console.warn('Audio synth non disponibile:', err);
  }
}

export function playTimerCompleteSound(theme = 'dark') {
  const file = theme === 'dark' ? '/timer-dark.mp3' : '/timer-light.mp3';

  try {
    const audio = new Audio(file);
    audio.volume = 0.95;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Riproduzione MP3 non consentita o fallita, attivo fallback sintetizzato:', err);
        playSynthesizedSound(theme);
      });
      return;
    }
  } catch (err) {
    console.warn('Errore istanza Audio HTML5, attivo fallback sintetizzato:', err);
    playSynthesizedSound(theme);
  }
}
