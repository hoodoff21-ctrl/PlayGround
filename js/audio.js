const STORAGE_KEY = "blade-chain-muted";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambience = null;
    this.noiseBuffer = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  init() {
    if (this.ctx) {
      this.resume();
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;

    try {
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.22;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);

      const length = Math.floor(this.ctx.sampleRate * 0.8);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }

      this.startAmbience();
      this.resume();
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try {
      localStorage.setItem(STORAGE_KEY, this.muted ? "1" : "0");
    } catch {}

    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, now, 0.025);
    }
  }

  get isMuted() {
    return this.muted;
  }

  startAmbience() {
    if (!this.ctx || this.ambience) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.038, now + 2.5);
    bus.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    filter.connect(bus);

    [55, 82.5, 110].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = index === 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? 6 : -4;
      const gain = ctx.createGain();
      gain.gain.value = index === 2 ? 0.08 : 0.15;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
    });

    if (this.noiseBuffer) {
      const wind = ctx.createBufferSource();
      wind.buffer = this.noiseBuffer;
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 280;
      windFilter.Q.value = 0.4;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.12;
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(bus);
      wind.start();

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain);
      lfoGain.connect(windGain.gain);
      lfo.start();
    }

    this.ambience = bus;
  }

  tone(frequency, duration, type = "sine", volume = 0.08, destination = null, start = 0) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + start;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination || this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  slice(chain = 1, pan = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const destination = panner || this.master;
    if (panner) {
      panner.pan.value = clamp(pan, -1, 1);
      panner.connect(this.master);
    }

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(2400 + Math.min(chain, 18) * 80, now);
    band.frequency.exponentialRampToValueAtTime(520, now + 0.13);
    band.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    source.connect(band);
    band.connect(gain);
    gain.connect(destination);
    source.start(now);
    source.stop(now + 0.17);

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(190 + chain * 4, now);
    thump.frequency.exponentialRampToValueAtTime(70, now + 0.1);
    thumpGain.gain.setValueAtTime(0.08, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    thump.connect(thumpGain);
    thumpGain.connect(destination);
    thump.start(now);
    thump.stop(now + 0.14);

    if (chain > 1) {
      const step = Math.min(chain, 14);
      const pitch = 330 * Math.pow(2, (step % 12) / 12);
      this.tone(pitch, 0.18, "sine", 0.045, destination, 0.008);
      this.tone(pitch * 1.5, 0.12, "triangle", 0.018, destination, 0.012);
    }
  }

  milestone(chain) {
    if (!this.ctx || this.muted) return;
    const steps = [0, 0.055, 0.11, 0.17];
    const base = 220 * Math.pow(2, Math.min(chain / 24, 1));
    const ratios = [1, 1.25, 1.5, 2];
    ratios.forEach((ratio, index) => {
      this.tone(base * ratio, 0.7 - index * 0.07, index === 0 ? "triangle" : "sine", 0.07 - index * 0.01, null, steps[index]);
    });
  }

  bomb() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.setValueAtTime(1200, now);
    low.frequency.exponentialRampToValueAtTime(90, now + 0.7);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.75, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    source.connect(low);
    low.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + 0.9);

    const oscillator = ctx.createOscillator();
    const oscGain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(105, now);
    oscillator.frequency.exponentialRampToValueAtTime(28, now + 0.62);
    oscGain.gain.setValueAtTime(0.52, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    oscillator.connect(oscGain);
    oscGain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.84);
  }

  miss() {
    if (!this.ctx || this.muted) return;
    this.tone(150, 0.22, "sine", 0.08);
    this.tone(78, 0.3, "triangle", 0.045, null, 0.025);
  }

  gameOver() {
    if (!this.ctx || this.muted) return;
    const notes = [196, 174.6, 146.8, 130.8];
    notes.forEach((frequency, index) => {
      this.tone(frequency, 1.7 - index * 0.12, "sine", 0.065, null, index * 0.22);
      this.tone(frequency / 2, 1.9 - index * 0.1, "triangle", 0.028, null, index * 0.22);
    });
  }

  click() {
    if (!this.ctx || this.muted) return;
    this.tone(520, 0.09, "sine", 0.035);
    this.tone(780, 0.06, "triangle", 0.018, null, 0.015);
  }

  comboBreak() {
    if (!this.ctx || this.muted) return;
    this.tone(240, 0.16, "sine", 0.035);
    this.tone(180, 0.22, "sine", 0.025, null, 0.06);
  }
}
