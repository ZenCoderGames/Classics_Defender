import { CONFIG } from './config.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.music = null;
    this.musicGain = null;
    this.musicConnected = false;
    this.musicWanted = false;
    this.thrustHum = { active: false, nodes: null, stopTimer: null };
    this.hitPingStep = 0;
    this.hitPingResetTimer = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.setupMusic();
  }

  getCtx() {
    if (!this.enabled) return null;
    this.init();
    return this.ctx;
  }

  setupMusic() {
    if (this.music) return;
    this.music = new Audio(CONFIG.audio.musicPath);
    this.music.loop = true;
    this.music.preload = 'auto';
  }

  connectMusicToGraph() {
    const ac = this.getCtx();
    if (!ac || this.musicConnected) return;

    const source = ac.createMediaElementSource(this.music);
    this.musicGain = ac.createGain();
    source.connect(this.musicGain);
    this.musicGain.connect(ac.destination);
    this.musicConnected = true;
    this.music.volume = 1;
  }

  getMusicGainValue() {
    const { masterVolume, musicVolume, musicAttenuation } = CONFIG.audio;
    return musicVolume * masterVolume * musicAttenuation;
  }

  syncMusicVolume() {
    this.connectMusicToGraph();
    const gain = this.getMusicGainValue();
    if (this.musicGain) {
      this.musicGain.gain.value = this.enabled && this.musicWanted ? gain : 0;
    } else if (this.music) {
      this.music.volume = this.enabled ? gain : 0;
    }
  }

  updateMusicVolume() {
    this.syncMusicVolume();
  }

  startMusic() {
    this.musicWanted = true;
    if (!this.enabled) return;
    this.init();
    this.setupMusic();
    this.syncMusicVolume();
    this.music.play().catch(() => {});
  }

  pauseMusic() {
    this.music?.pause();
    if (this.musicGain) this.musicGain.gain.value = 0;
  }

  resumeMusic() {
    if (!this.musicWanted || !this.enabled) return;
    this.setupMusic();
    this.syncMusicVolume();
    this.music.play().catch(() => {});
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.stopThrust();
      this.pauseMusic();
    } else if (this.musicWanted) {
      this.resumeMusic();
    }
    this.syncMusicVolume();
  }

  update(dt) {
    if (this.hitPingResetTimer <= 0) return;
    this.hitPingResetTimer -= dt * 1000;
    if (this.hitPingResetTimer <= 0) {
      this.hitPingStep = 0;
    }
  }

  play(type) {
    if (!this.enabled) return;
    const ac = this.getCtx();
    if (!ac) return;

    switch (type) {
      case 'laser': this.sfxShoot(); break;
      case 'enemyLaser': this.sfxEnemyShot(); break;
      case 'explosion': this.sfxDestroy('medium'); break;
      case 'smallExplosion': this.sfxDestroy('small'); this.playProjectileHitPing(); break;
      case 'playerDeath': this.sfxDeath(); break;
      case 'rescue': this.sfxRescue(); break;
      case 'humanoidDeath': this.sfxHumanoidDeath(); break;
      case 'abduction': this.sfxAbduction(); break;
      case 'mutantTransform': this.sfxMutantTransform(); break;
      case 'smartBomb': this.sfxSmartBomb(); break;
      case 'hyperspace': this.sfxHyperspace(); break;
      case 'hyperspaceFail': this.sfxHyperspaceFail(); break;
      case 'waveStart': this.sfxWave(); break;
      case 'waveClear': this.sfxWaveClear(); break;
      case 'extraLife': this.sfxExtraLife(); break;
      case 'baiterSpawn': this.sfxBaiterSpawn(); break;
      case 'planetDestroy': this.sfxPlanetDestroy(); break;
      case 'spawn': this.sfxSpawn(); break;
      default: break;
    }
  }

  playTone({ freq = 440, duration = 0.1, type = 'sine', volume = 0.12, freqEnd = null, attack = 0.008, startTime = null }) {
    const ac = this.getCtx();
    if (!ac) return;

    const now = startTime ?? ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const vol = volume * CONFIG.audio.masterVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 30), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSciFiLaser({
    freq,
    freqEnd,
    duration = 0.08,
    type = 'square',
    volume = 0.1,
    filterHz = 2400,
    filterType = 'lowpass',
    attack = 0.004,
    startTime = null,
  }) {
    const ac = this.getCtx();
    if (!ac) return;

    const now = startTime ?? ac.currentTime;
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    const vol = volume * CONFIG.audio.masterVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 30), now + duration);
    filter.type = filterType;
    filter.frequency.value = filterHz;
    filter.Q.value = filterType === 'bandpass' ? 2.4 : 0.8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSciFiBurst({
    duration = 0.16,
    volume = 0.11,
    filterStart = 1200,
    filterEnd = 140,
    filterType = 'bandpass',
    q = 1.8,
    startTime = null,
  }) {
    const ac = this.getCtx();
    if (!ac) return;

    const now = startTime ?? ac.currentTime;
    const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    const vol = volume * CONFIG.audio.masterVolume;

    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(filterStart, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(filterEnd, 40), now + duration);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  playProjectileHitPing() {
    const ac = this.getCtx();
    if (!ac) return;

    const cfg = CONFIG.audio.hitPing;
    const step = Math.min(this.hitPingStep, cfg.maxStep);
    const now = ac.currentTime;
    const frequency = cfg.baseFreq * cfg.pitchRatio ** step;
    const vol = cfg.volume * CONFIG.audio.masterVolume;

    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * cfg.pitchBend, now + 0.04);
    filter.type = 'bandpass';
    filter.frequency.value = frequency * 1.6;
    filter.Q.value = 3.2;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + cfg.durationSec + 0.02);

    this.hitPingStep += 1;
    this.hitPingResetTimer = cfg.comboResetMs;
  }

  sfxSpawn() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiLaser({ freq: 280, freqEnd: 920, duration: 0.14, volume: 0.08, type: 'triangle', filterHz: 1800, startTime: now });
    this.playTone({ freq: 520, freqEnd: 1040, duration: 0.1, type: 'square', volume: 0.06, startTime: now + 0.05 });
  }

  sfxShoot() {
    this.playSciFiLaser({ freq: 1480, freqEnd: 160, duration: 0.09, volume: 0.1, type: 'square', filterHz: 2600 });
  }

  sfxEnemyShot() {
    this.playSciFiLaser({ freq: 520, freqEnd: 90, duration: 0.07, volume: 0.07, type: 'triangle', filterHz: 1400 });
  }

  sfxDestroy(size = 'medium') {
    const scale = size === 'large' ? 0.75 : size === 'small' ? 1.35 : 1;
    this.playSciFiBurst({
      duration: 0.12 * scale,
      volume: 0.1,
      filterStart: 900 * scale,
      filterEnd: 120,
    });
    this.playSciFiLaser({
      freq: (size === 'large' ? 220 : size === 'small' ? 480 : 340) * scale,
      freqEnd: 50,
      duration: 0.12 * scale,
      volume: 0.08,
      type: 'sawtooth',
      filterHz: 1400,
    });
  }

  sfxDeath() {
    this.playSciFiBurst({ duration: 0.35, volume: 0.13, filterStart: 1100, filterEnd: 60, q: 2.4 });
    this.playSciFiLaser({ freq: 380, freqEnd: 28, duration: 0.4, volume: 0.1, type: 'sawtooth', filterHz: 900 });
    this.playTone({ freq: 160, freqEnd: 40, duration: 0.35, type: 'square', volume: 0.07 });
  }

  sfxHyperspace() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.28, volume: 0.08, filterStart: 180, filterEnd: 4200, filterType: 'bandpass', q: 2.8, startTime: now });
    this.playSciFiLaser({ freq: 90, freqEnd: 880, duration: 0.22, volume: 0.09, type: 'sine', filterHz: 3200, startTime: now });
    this.playSciFiLaser({ freq: 880, freqEnd: 120, duration: 0.18, volume: 0.06, type: 'triangle', filterHz: 1800, startTime: now + 0.12 });
  }

  sfxHyperspaceFail() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.2, volume: 0.1, filterStart: 2200, filterEnd: 80, q: 2.6, startTime: now });
    this.playSciFiLaser({ freq: 640, freqEnd: 40, duration: 0.18, volume: 0.09, type: 'sawtooth', filterHz: 700, startTime: now });
    this.playTone({ freq: 120, freqEnd: 35, duration: 0.22, type: 'square', volume: 0.08, startTime: now + 0.04 });
  }

  sfxWave() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [520, 780, 1040].forEach((freq, i) => {
      this.playTone({ freq, freqEnd: freq * 1.08, duration: 0.07, type: 'square', volume: 0.07, startTime: now + i * 0.07 });
    });
  }

  sfxWaveClear() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [660, 880, 1175, 1568].forEach((freq, i) => {
      this.playTone({ freq, freqEnd: freq * 1.06, duration: 0.08, type: 'square', volume: 0.07, startTime: now + i * 0.07 });
    });
  }

  sfxBaiterSpawn() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [440, 320, 440, 280].forEach((freq, i) => {
      this.playSciFiLaser({
        freq,
        freqEnd: freq * 0.65,
        duration: 0.07,
        volume: 0.06,
        type: 'square',
        filterHz: 900,
        startTime: now + i * 0.08,
      });
    });
  }

  sfxExtraLife() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.playTone({ freq, freqEnd: freq * 1.05, duration: 0.09, type: 'square', volume: 0.07, startTime: now + i * 0.08 });
    });
  }

  sfxRescue() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiLaser({ freq: 420, freqEnd: 880, duration: 0.12, volume: 0.07, type: 'sine', filterHz: 2000, startTime: now });
    this.playTone({ freq: 660, freqEnd: 990, duration: 0.1, type: 'square', volume: 0.06, startTime: now + 0.06 });
    this.playTone({ freq: 990, freqEnd: 1320, duration: 0.12, type: 'sine', volume: 0.05, startTime: now + 0.12 });
  }

  sfxHumanoidDeath() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.1, volume: 0.06, filterStart: 600, filterEnd: 100, q: 1.6, startTime: now });
    this.playTone({ freq: 280, freqEnd: 120, duration: 0.18, type: 'triangle', volume: 0.06, startTime: now });
  }

  sfxAbduction() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiLaser({ freq: 180, freqEnd: 420, duration: 0.2, volume: 0.06, type: 'sine', filterHz: 900, startTime: now });
    this.playSciFiLaser({ freq: 420, freqEnd: 220, duration: 0.16, volume: 0.05, type: 'triangle', filterHz: 700, startTime: now + 0.1 });
  }

  sfxMutantTransform() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.18, volume: 0.09, filterStart: 500, filterEnd: 70, q: 2.1, startTime: now });
    [360, 240, 320, 180].forEach((freq, i) => {
      this.playSciFiLaser({
        freq,
        freqEnd: freq * 0.5,
        duration: 0.08,
        volume: 0.07,
        type: 'sawtooth',
        filterHz: 1100,
        startTime: now + i * 0.07,
      });
    });
  }

  sfxSmartBomb() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.45, volume: 0.14, filterStart: 1400, filterEnd: 50, q: 2.5, startTime: now });
    this.playSciFiLaser({ freq: 280, freqEnd: 24, duration: 0.42, volume: 0.11, type: 'sawtooth', filterHz: 800, startTime: now });
    this.playTone({ freq: 90, freqEnd: 28, duration: 0.38, type: 'square', volume: 0.08, startTime: now + 0.04 });
  }

  sfxPlanetDestroy() {
    const ac = this.getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    this.playSciFiBurst({ duration: 0.55, volume: 0.15, filterStart: 1300, filterEnd: 45, q: 2.6, startTime: now });
    this.playSciFiLaser({ freq: 320, freqEnd: 22, duration: 0.55, volume: 0.11, type: 'sawtooth', filterHz: 750, startTime: now });
    this.playTone({ freq: 140, freqEnd: 30, duration: 0.5, type: 'square', volume: 0.08, startTime: now + 0.06 });
  }

  setThrust(active) {
    if (!this.enabled) return;
    if (active) this.startThrustHum();
    else this.stopThrustHum();
  }

  startThrustHum() {
    const ac = this.getCtx();
    if (!ac || this.thrustHum.active) return;

    if (this.thrustHum.stopTimer) {
      clearTimeout(this.thrustHum.stopTimer);
      this.thrustHum.stopTimer = null;
    }

    const cfg = CONFIG.audio;
    const now = ac.currentTime;
    const fadeSec = cfg.thrustHumFadeMs / 1000;

    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.value = cfg.thrustHumFreq;
    filter.type = 'lowpass';
    filter.frequency.value = cfg.thrustHumFilterHz;
    filter.Q.value = 0.7;

    const targetVol = cfg.thrustHumVolume * cfg.masterVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(targetVol, 0.0002), now + fadeSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);

    this.thrustHum.active = true;
    this.thrustHum.nodes = { osc, filter, gain };
  }

  stopThrustHum() {
    if (!this.thrustHum.active || !this.thrustHum.nodes) return;

    const ac = this.ctx;
    const nodes = this.thrustHum.nodes;
    this.thrustHum.active = false;
    this.thrustHum.nodes = null;

    if (!ac) return;

    const now = ac.currentTime;
    const fadeSec = CONFIG.audio.thrustHumFadeMs / 1000;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 0.0001), now);
    nodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSec);

    if (this.thrustHum.stopTimer) clearTimeout(this.thrustHum.stopTimer);
    this.thrustHum.stopTimer = setTimeout(() => {
      try {
        nodes.osc.stop();
      } catch {
        // Oscillator may already be stopped.
      }
      this.thrustHum.stopTimer = null;
    }, CONFIG.audio.thrustHumFadeMs + 40);
  }

  stopThrust() {
    this.stopThrustHum();
  }
}
