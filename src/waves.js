import { CONFIG, getWaveConfig } from './config.js';
import { wrapX } from './world.js';
import { createHumanoids } from './entities/humanoid.js';
import { createLander } from './entities/enemies/lander.js';
import { createMutant } from './entities/enemies/mutant.js';
import { createBomber } from './entities/enemies/bomber.js';
import { createPod } from './entities/enemies/pod.js';
import { createBaiter } from './entities/enemies/baiter.js';

export class WaveManager {
  constructor(game) {
    this.game = game;
    this.wave = 1;
    this.waveTimer = 0;
    this.baiterTimer = 0;
    this.baiterSpawned = false;
    this.waveClearPending = false;
    this.waveClearTimer = 0;
    this.combatSuspended = false;
  }

  reset() {
    this.wave = 1;
    this.waveTimer = 0;
    this.baiterTimer = 0;
    this.baiterSpawned = false;
    this.waveClearPending = false;
    this.waveClearTimer = 0;
    this.combatSuspended = false;
  }

  suspendCombat() {
    this.combatSuspended = true;
  }

  spawnWaveEnemies() {
    const game = this.game;
    const cfg = getWaveConfig(this.wave);
    const speedMul = cfg.speedMul * (game.planetDestroyed ? CONFIG.waves.planetLossMutantMultiplier : 1);
    const spawnY = () => CONFIG.world.skyTop + 50 + Math.random() * 100;

    for (let i = 0; i < cfg.landers; i++) {
      game.enemies.push(createLander(Math.random() * CONFIG.world.width, spawnY(), speedMul));
    }
    for (let i = 0; i < cfg.bombers; i++) {
      game.enemies.push(createBomber(Math.random() * CONFIG.world.width, spawnY(), speedMul));
    }
    for (let i = 0; i < cfg.pods; i++) {
      game.enemies.push(createPod(Math.random() * CONFIG.world.width, spawnY(), speedMul));
    }

    if (game.planetDestroyed) {
      const extraMutants = Math.floor(cfg.landers * 0.5);
      for (let i = 0; i < extraMutants; i++) {
        game.enemies.push(createMutant(Math.random() * CONFIG.world.width, spawnY(), speedMul));
      }
    }

    this.baiterTimer = 0;
    this.baiterSpawned = false;
  }

  respawnWaveEnemies() {
    this.combatSuspended = false;
    this.spawnWaveEnemies();
    for (const e of this.game.enemies) {
      this.game.particles.spawn(e.x, e.y, CONFIG.colors[e.type] || '#fff');
    }
    this.game.audio.play('spawn');
  }

  startWave() {
    const game = this.game;

    game.enemies = [];
    game.mines = [];
    game.projectiles = game.projectiles.filter((p) => p.owner === 'player');

    if (this.wave === 1 || !game.humanoids.some((h) => h.alive)) {
      game.humanoids = createHumanoids(CONFIG.humanoid.count);
    }

    this.combatSuspended = false;
    this.spawnWaveEnemies();

    this.waveClearPending = false;

    game.onWaveStart(this.wave);
  }

  update(dt) {
    const game = this.game;

    if (this.combatSuspended) return;

    if (this.waveClearPending) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.waveClearPending = false;
        this.wave++;
        this.startWave();
      }
      return;
    }

    const aliveEnemies = game.enemies.filter((e) => e.alive);
    if (aliveEnemies.length === 0) {
      this.triggerWaveClear();
      return;
    }

    if (!this.baiterSpawned) {
      this.baiterTimer += dt;
      const delay = Math.max(
        CONFIG.waves.baiterDelayMin,
        CONFIG.waves.baiterDelayBase - (this.wave - 1) * CONFIG.waves.baiterDelayReduction
      );
      if (this.baiterTimer >= delay) {
        this.baiterSpawned = true;
        const cfg = getWaveConfig(this.wave);
        game.enemies.push(createBaiter(wrapX(game.player.x + CONFIG.canvas.width), CONFIG.world.skyTop + 40, cfg.speedMul));
        game.audio.play('baiterSpawn');
      }
    }
  }

  triggerWaveClear() {
    const game = this.game;
    this.waveClearPending = true;
    this.waveClearTimer = 2.0;

    const surviving = game.humanoids.filter((h) => h.alive).length;
    const bonus = surviving * CONFIG.scoring.waveClearPerHumanoid;
    const protectedBonus = surviving * CONFIG.scoring.protectedPerWave;
    game.addScore(bonus + protectedBonus);

    game.audio.play('waveClear');
    game.particles.burst(game.player.x, game.player.y, 20, CONFIG.colors.player, 80);
  }

  spawnMutantFromLander(lander) {
    const cfg = getWaveConfig(this.wave);
    const mutant = createMutant(lander.x, lander.y, cfg.speedMul);
    this.game.enemies.push(mutant);
    this.game.audio.play('mutantTransform');
    this.game.particles.burst(lander.x, lander.y, CONFIG.juice.deathParticleCount, CONFIG.colors.mutant, 150);
  }
}
