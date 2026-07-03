import { CONFIG } from './config.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.thrustOsc = null;
    this.thrustGain = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stopThrust();
  }

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    switch (type) {
      case 'laser': this.tone(880, 0.05, 'square', 0.15); break;
      case 'enemyLaser': this.tone(440, 0.06, 'sawtooth', 0.1); break;
      case 'explosion': this.noise(0.2, 0.25); this.tone(120, 0.15, 'sawtooth', 0.2); break;
      case 'smallExplosion': this.noise(0.1, 0.15); break;
      case 'playerDeath': this.noise(0.35, 0.4); this.tone(80, 0.3, 'sawtooth', 0.3); break;
      case 'rescue': this.tone(660, 0.08, 'sine', 0.2); this.tone(990, 0.12, 'sine', 0.15, 0.08); break;
      case 'humanoidDeath': this.tone(220, 0.2, 'triangle', 0.2); break;
      case 'abduction': this.tone(330, 0.15, 'sawtooth', 0.12); break;
      case 'mutantTransform': this.tone(150, 0.25, 'sawtooth', 0.25); this.noise(0.15, 0.2); break;
      case 'smartBomb': this.noise(0.4, 0.5); this.tone(60, 0.4, 'sine', 0.3); break;
      case 'hyperspace': this.noise(0.2, 0.3); this.tone(400, 0.2, 'sine', 0.15); break;
      case 'hyperspaceFail': this.noise(0.3, 0.35); this.tone(100, 0.25, 'sawtooth', 0.25); break;
      case 'waveStart': this.tone(523, 0.1, 'square', 0.15); this.tone(784, 0.15, 'square', 0.12, 0.1); break;
      case 'waveClear': this.tone(784, 0.1, 'square', 0.15); this.tone(1047, 0.2, 'square', 0.12, 0.1); break;
      case 'extraLife': this.tone(523, 0.08, 'sine', 0.2); this.tone(659, 0.08, 'sine', 0.18, 0.08); this.tone(784, 0.15, 'sine', 0.15, 0.16); break;
      case 'baiterSpawn': this.tone(900, 0.12, 'sawtooth', 0.18); break;
      case 'planetDestroy': this.noise(0.5, 0.6); this.tone(55, 0.5, 'sawtooth', 0.35); break;
      case 'spawn': this.tone(300, 0.06, 'sine', 0.08); break;
      default: break;
    }
  }

  tone(freq, duration, type = 'sine', volume = 0.2, delay = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const t = this.ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume * CONFIG.audio.masterVolume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  noise(duration, volume = 0.2) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume * CONFIG.audio.masterVolume;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  setThrust(active) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (active && !this.thrustOsc) {
      this.thrustOsc = this.ctx.createOscillator();
      this.thrustGain = this.ctx.createGain();
      this.thrustOsc.type = 'sawtooth';
      this.thrustOsc.frequency.value = 80;
      this.thrustGain.gain.value = CONFIG.audio.thrustVolume * CONFIG.audio.masterVolume;
      this.thrustOsc.connect(this.thrustGain);
      this.thrustGain.connect(this.ctx.destination);
      this.thrustOsc.start();
    } else if (!active && this.thrustOsc) {
      this.stopThrust();
    }
  }

  stopThrust() {
    if (this.thrustOsc) {
      try { this.thrustOsc.stop(); } catch (_) { /* already stopped */ }
      this.thrustOsc.disconnect();
      this.thrustGain?.disconnect();
      this.thrustOsc = null;
      this.thrustGain = null;
    }
  }
}
