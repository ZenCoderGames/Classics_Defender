/** All tunable game parameters */
export const CONFIG = {
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
    groundY: 420,
    skyTop: 40,
  },

  camera: {
    followLerp: 0.12,
  },

  player: {
    width: 22,
    height: 10,
    speedX: 300,
    speedY: 140,
    startLives: 3,
    startBombs: 3,
    fireCooldown: 0.11,
    maxActiveShots: 4,
    invulnTime: 2.0,
    respawnDelay: 1.5,
    enemyRespawnDelay: 2.0,
    respawnY: 200,
    thrustTrailRate: 0.03,
  },

  hyperspace: {
    failChance: 0.1,
    cooldown: 0.5,
  },

  laser: {
    width: 14,
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
    dropProximity: 6,
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
    terrain: '#1a4a1a',
    terrainLine: '#39ff14',
    star: '#1a3a1a',
    starBright: '#2a5a2a',
    abductionBeam: '#ffaa0088',
    explosion: '#39ff14',
    smartBombFlash: '#ffffff',
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

  audio: {
    masterVolume: 0.35,
    thrustVolume: 0.08,
  },

  enemies: {
    lander: {
      width: 18,
      height: 14,
      speed: 90,
      carrySpeed: 70,
      abductTime: 1.2,
      beamRange: 60,
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
