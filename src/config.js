/** All tunable game parameters */
export const CONFIG = {
  debug: {
    showMobileControls: false,
  },

  canvas: {
    width: 640,
    height: 480,
  },

  radar: {
    height: 48,
    padding: 4,
  },

  world: {
    width: 3840,
    height: 480,
    groundY: 370,
    humanoidGroundY: 458,
    skyTop: 40,
  },

  terrain: {
    stepSize: 45,
    peakHeight: 38,
    valleyDepth: 12,
    peakLevels: 7,
  },

  camera: {
    followLerp: 0.12,
  },

  stars: {
    count: 68,
    minRadius: 0.6,
    maxRadius: 2.4,
  },

  player: {
    width: 22,
    height: 10,
    speedX: 300,
    speedY: 140,
    accelX: 720,
    decelX: 520,
    accelY: 560,
    decelY: 420,
    startLives: 3,
    startBombs: 3,
    fireCooldown: 0.15,
    maxActiveShots: 12,
    invulnTime: 2.0,
    respawnDelay: 1.5,
    enemyRespawnDelay: 2.0,
    respawnY: 200,
    thrustTrailRate: 0.1,
    bottomMargin: 6,
  },

  hyperspace: {
    failChance: 0.1,
    cooldown: 0.5,
  },

  laser: {
    width: 35,
    height: 3,
    speed: 520,
    maxRange: 720,
    color: '#39ff14',
  },

  humanoid: {
    count: 10,
    width: 6,
    height: 10,
    fallSpeed: 60,
    safeFallSpeed: 40,
    catchRadius: 18,
    carryOffsetY: 14,
    dropProximity: 12,
    carryDropPlayerOffset: 18,
    spacing: 340,
    startOffset: 120,
  },

  scoring: {
    lander: 150,
    mutant: 150,
    bomber: 250,
    pod: 1000,
    swarmer: 150,
    baiter: 200,
    mine: 50,
    rescue: 500,
    protectedPerWave: 100,
    waveClearPerHumanoid: 250,
    extraLifeInterval: 10000,
  },

  colors: {
    background: '#020402',
    player: '#39ff14',
    playerAlt: '#00ffcc',
    laser: '#39ff14',
    enemyLaser: '#ff4466',
    lander: '#ffaa00',
    mutant: '#ff3355',
    bomber: '#cc66ff',
    baiter: '#00ffff',
    pod: '#ffff44',
    swarmer: '#ff8844',
    mine: '#ff6688',
    humanoid: '#66ffaa',
    humanoidGrabbed: '#ffcc00',
    terrain: '#020402',
    terrainLine: '#ff8800',
    star: '#cfcfcf',
    starBright: '#e7e7e7',
    abductionBeam: '#ffaa0088',
    explosion: '#39ff14',
    smartBombFlash: '#ffffff',
  },

  postProcess: {
    enabled: true,
    blur: 10,
    strength: 0.5,
    scale: 0.5,
    blendMode: 'screen',
  },

  juice: {
    hitPauseMs: 80,
    hitPausePlayerMs: 120,
    shakeHit: 6,
    shakeDeath: 18,
    playerDeathDuration: 0.7,
    shakeBomb: 10,
    flashDuration: 0.15,
    smartBombFlashDuration: 0.35,
    spawnParticleCount: 8,
    hitParticleCount: 12,
    deathParticleCount: 24,
    shotParticleCount: 3,
  },

  scorePopup: {
    duration: 0.9,
    floatSpeed: 48,
    fontSize: 15,
    hueSpeed: 140,
  },

  enemySpawn: {
    duration: 0.5,
    particleCount: 20,
    startRadius: 100,
  },

  audio: {
    masterVolume: 0.38,
    musicVolume: 1.0,
    musicAttenuation: 0.42,
    musicPath: 'audio/music.mp3',
    thrustHumVolume: 0.12,
    thrustHumFreq: 46,
    thrustHumFilterHz: 140,
    thrustHumFadeMs: 120,
    hitPing: {
      baseFreq: 420,
      pitchRatio: 1.08,
      pitchBend: 1.22,
      durationSec: 0.07,
      volume: 0.11,
      comboResetMs: 900,
      maxStep: 24,
    },
  },

  enemies: {
    lander: {
      width: 18,
      height: 14,
      speed: 90,
      carrySpeed: 70,
      abductTime: 1.2,
      beamRange: 60,
      hoverAboveHumanoid: 22,
      abductAlignX: 30,
      abductAlignY: 28,
      score: 150,
    },
    mutant: {
      width: 16,
      height: 14,
      speed: 180,
      wobble: 120,
      score: 150,
    },
    bomber: {
      width: 20,
      height: 16,
      speed: 60,
      mineInterval: 2.5,
      score: 250,
    },
    mine: {
      radius: 8,
      driftSpeed: 25,
      lifetime: 12,
      score: 50,
    },
    baiter: {
      width: 18,
      height: 12,
      speed: 150,
      score: 200,
    },
    pod: {
      width: 22,
      height: 22,
      speed: 50,
      swarmerCount: 5,
      score: 1000,
    },
    swarmer: {
      width: 10,
      height: 10,
      speed: 160,
      wobble: 200,
      score: 150,
    },
    enemyBullet: {
      speed: 175,
      cooldown: 3.6,
      radius: 3,
    },
  },

  waves: {
    baiterDelayBase: 45,
    baiterDelayMin: 15,
    baiterDelayReduction: 2,
    planetLossMutantMultiplier: 2,
    definitions: [
      { landers: 5, bombers: 0, pods: 0, speedMul: 1.0 },
      { landers: 7, bombers: 0, pods: 0, speedMul: 1.1 },
      { landers: 6, bombers: 2, pods: 0, speedMul: 1.15 },
      { landers: 5, bombers: 2, pods: 2, speedMul: 1.2 },
      { landers: 6, bombers: 3, pods: 2, speedMul: 1.25 },
      { landers: 8, bombers: 3, pods: 3, speedMul: 1.3 },
      { landers: 8, bombers: 4, pods: 3, speedMul: 1.35 },
      { landers: 10, bombers: 4, pods: 4, speedMul: 1.4 },
    ],
    escalationPerWave: {
      landers: 1,
      bombers: 0.5,
      pods: 0.3,
      speedMul: 0.05,
      maxSpeedMul: 2.0,
    },
  },

  planet: {
    destructionDuration: 3.0,
  },

  debug: {
    showBounds: false,
    godMode: false,
  },
};

export function getWaveConfig(waveNumber) {
  const { definitions, escalationPerWave } = CONFIG.waves;
  const base = definitions[Math.min(waveNumber - 1, definitions.length - 1)];
  const extraWaves = Math.max(0, waveNumber - definitions.length);
  const esc = escalationPerWave;

  return {
    landers: Math.floor(base.landers + extraWaves * esc.landers),
    bombers: Math.floor(base.bombers + extraWaves * esc.bombers),
    pods: Math.floor(base.pods + extraWaves * esc.pods),
    speedMul: Math.min(
      base.speedMul + extraWaves * esc.speedMul,
      esc.maxSpeedMul
    ),
  };
}

export function getBaiterDelay(waveNumber) {
  const { baiterDelayBase, baiterDelayMin, baiterDelayReduction } = CONFIG.waves;
  return Math.max(baiterDelayMin, baiterDelayBase - (waveNumber - 1) * baiterDelayReduction);
}
