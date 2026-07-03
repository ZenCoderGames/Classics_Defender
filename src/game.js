import { CONFIG } from './config.js';
import { World, wrapX } from './world.js';
import { Input } from './input.js';
import { Player } from './entities/player.js';
import { createHumanoids, updateHumanoid, drawHumanoid, dropCarriedHumanoid, releaseHumanoidToGround, canDropCarriedHumanoid, livingHumanoidCount } from './entities/humanoid.js';
import { updateProjectile, drawProjectile, projectileHitsRect, rectsOverlap } from './entities/projectile.js';
import { updateLander, drawLander, landerBounds, releaseGrabbedHumanoid } from './entities/enemies/lander.js';
import { createMutant, updateMutant, drawMutant, enemyBounds as mutantBounds } from './entities/enemies/mutant.js';
import { updateBomber, updateMine, drawBomber, drawMine, mineBounds, enemyBounds as bomberBounds } from './entities/enemies/bomber.js';
import { updateBaiter, drawBaiter, enemyBounds as baiterBounds } from './entities/enemies/baiter.js';
import { updatePod, drawPod, splitPod, enemyBounds as podBounds } from './entities/enemies/pod.js';
import { updateSwarmer, drawSwarmer, enemyBounds as swarmerBounds } from './entities/enemies/swarmer.js';
import { WaveManager } from './waves.js';
import { Radar } from './radar.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';

const HIGH_SCORE_KEY = 'defender-high-score';

export class Game {
  constructor(canvas, radarCanvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.input = new Input();
    this.world = new World();
    this.player = new Player();
    this.particles = new ParticleSystem();
    this.audio = new AudioManager();
    this.radar = new Radar(radarCanvas);
    this.waves = new WaveManager(this);

    this.state = 'menu';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    this.nextExtraLife = CONFIG.scoring.extraLifeInterval;

    this.enemies = [];
    this.mines = [];
    this.humanoids = [];
    this.projectiles = [];

    this.hitPause = 0;
    this.smartBombFlash = 0;
    this.planetDestroyed = false;
    this.planetDestroyTimer = 0;
    this.respawnTimer = 0;
    this.enemyRespawnTimer = 0;
    this.thrustTimer = 0;
    this.deathExplosions = [];

    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.nextExtraLife = CONFIG.scoring.extraLifeInterval;
    this.planetDestroyed = false;
    this.planetDestroyTimer = 0;
    this.player.reset();
    this.enemies = [];
    this.mines = [];
    this.projectiles = [];
    this.particles.clear();
    this.deathExplosions = [];
    this.enemyRespawnTimer = 0;
    this.waves.reset();
    this.waves.startWave();
    this.hideAllOverlays();
    this.input.enabled = true;
    this.updateHUD();
  }

  hideAllOverlays() {
    this.ui.menuOverlay.classList.add('hidden');
    this.ui.controlsOverlay.classList.add('hidden');
    this.ui.pauseOverlay.classList.add('hidden');
    this.ui.gameoverOverlay.classList.add('hidden');
  }

  addScore(points) {
    this.score += points;
    while (this.score >= this.nextExtraLife) {
      this.player.lives++;
      this.nextExtraLife += CONFIG.scoring.extraLifeInterval;
      this.audio.play('extraLife');
    }
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
    this.updateHUD();
  }

  onWaveStart(wave) {
    this.audio.play('waveStart');
    for (const e of this.enemies) {
      this.particles.spawn(e.x, e.y, CONFIG.colors[e.type] || '#fff');
    }
    this.ui.waveEl.textContent = wave;
  }

  updateHUD() {
    this.ui.scoreEl.textContent = this.score;
    this.ui.livesEl.textContent = this.player.lives;
    this.ui.bombsEl.textContent = this.player.bombs;
    this.ui.humanoidsEl.textContent = livingHumanoidCount(this.humanoids);
    this.ui.highScoreEl.textContent = this.highScore;
    this.ui.waveEl.textContent = this.waves.wave;
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.pauseOverlay.classList.remove('hidden');
    this.audio.stopThrust();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.pauseOverlay.classList.add('hidden');
  }

  gameOver() {
    this.state = 'gameover';
    this.audio.stopThrust();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }

    this.ui.finalScore.textContent = `Score: ${this.score}`;
    this.ui.highScoreEl.textContent = this.highScore;
    this.ui.gameoverOverlay.classList.remove('hidden');
  }

  update(dt) {
    if (this.hitPause > 0) {
      this.hitPause -= dt * 1000;
      if (this.hitPause <= 0) this.hitPause = 0;
      this.draw();
      return;
    }

    if (this.state === 'menu' || this.state === 'gameover') {
      this.draw();
      return;
    }

    if (this.state === 'paused') {
      this.draw();
      return;
    }

    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0 && this.player.lives > 0) {
        this.revivePlayer();
      }
      this.updateEntities(dt * 0.5);
      this.updateDeathExplosions(dt);
      this.particles.update(dt);
      this.world.update(dt, this.player.x);
      this.draw();
      return;
    }

    if (this.enemyRespawnTimer > 0) {
      this.enemyRespawnTimer -= dt;
      if (this.enemyRespawnTimer <= 0) {
        this.waves.respawnWaveEnemies();
      }
      this.handleInput();
      this.player.update(dt, this.input, this.world);
      this.audio.setThrust(this.player.thrusting && this.player.alive);
      this.updateHumanoidsOnly(dt);
      this.checkPlanetLoss();
      this.world.update(dt, this.player.x);
      this.particles.update(dt);
      this.input.clearJustPressed();
      this.draw();
      return;
    }

    if (this.planetDestroyTimer > 0) {
      this.planetDestroyTimer -= dt;
      this.updateEntities(dt * 0.3);
      this.draw();
      return;
    }

    this.handleInput();
    this.player.update(dt, this.input, this.world);
    this.audio.setThrust(this.player.thrusting && this.player.alive);

    if (this.player.thrusting && this.player.alive) {
      this.thrustTimer -= dt;
      if (this.thrustTimer <= 0) {
        this.thrustTimer = CONFIG.player.thrustTrailRate;
        this.particles.trail(this.player.x, this.player.y, CONFIG.colors.playerAlt);
      }
    }

    if (this.player.carryingHumanoid && canDropCarriedHumanoid(this.player)) {
      const h = this.player.carryingHumanoid;
      releaseHumanoidToGround(h);
      this.player.carryingHumanoid = null;
      this.addScore(CONFIG.scoring.rescue);
      this.audio.play('rescue');
      this.particles.burst(h.x, h.y, 10, CONFIG.colors.humanoid, 60);
    }

    this.updateEntities(dt);
    this.waves.update(dt);
    this.checkCollisions();
    this.checkPlanetLoss();
    this.world.update(dt, this.player.x);
    this.particles.update(dt);

    this.updateDeathExplosions(dt);

    if (this.smartBombFlash > 0) this.smartBombFlash -= dt;

    this.input.clearJustPressed();
    this.updateHUD();
    this.draw();
  }

  handleInput() {
    if (this.input.pause()) {
      this.pause();
      return;
    }

    if (this.input.fire()) {
      const laser = this.player.tryFire(this.projectiles);
      if (laser) {
        this.audio.play('laser');
        this.particles.shot(laser.x, laser.y, this.player.facing, CONFIG.colors.laser);
      }
    }

    if (this.input.smartBomb()) {
      this.useSmartBomb();
    }

    if (this.input.hyperspace()) {
      this.useHyperspace();
    }
  }

  useSmartBomb() {
    if (this.player.bombs <= 0) return;

    this.player.bombs--;
    this.smartBombFlash = CONFIG.juice.smartBombFlashDuration;
    this.world.addShake(CONFIG.juice.shakeBomb, 0.4);
    this.audio.play('smartBomb');

    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this.world.isOnScreen(e.x)) {
        this.destroyEnemy(e, false);
      }
    }
    for (const m of this.mines) {
      if (m.alive && this.world.isOnScreen(m.x)) {
        m.alive = false;
        this.addScore(CONFIG.scoring.mine);
      }
    }
  }

  useHyperspace() {
    const result = this.player.hyperspace(this.world);
    if (result === 'blocked') return;

    if (result === 'fail') {
      this.audio.play('hyperspaceFail');
      this.killPlayer();
      return;
    }

    this.audio.play('hyperspace');
    this.particles.burst(this.player.x, this.player.y, 16, CONFIG.colors.playerAlt, 100);
  }

  updateEntities(dt) {
    for (const p of this.projectiles) updateProjectile(p, dt);
    this.projectiles = this.projectiles.filter((p) => p.alive);

    for (const h of this.humanoids) {
      const result = updateHumanoid(h, dt, this.player);
      if (result === 'death') {
        this.audio.play('humanoidDeath');
        this.particles.burst(h.x, h.y, 8, CONFIG.colors.humanoid, 50);
      }
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;

      if (e.type === 'lander') {
        const result = updateLander(e, dt, this.humanoids, this.projectiles, this.player);
        if (result === 'mutate') {
          releaseGrabbedHumanoid(e);
          e.alive = false;
          this.waves.spawnMutantFromLander(e);
        } else if (e.state === 'abducting' && !e.abductSoundPlayed) {
          e.abductSoundPlayed = true;
          this.audio.play('abduction');
        }
      } else if (e.type === 'mutant') {
        updateMutant(e, dt, this.player, this.projectiles);
      } else if (e.type === 'bomber') {
        updateBomber(e, dt, this.mines);
      } else if (e.type === 'baiter') {
        updateBaiter(e, dt, this.player, this.projectiles);
      } else if (e.type === 'pod') {
        updatePod(e, dt);
      } else if (e.type === 'swarmer') {
        updateSwarmer(e, dt, this.player);
      }
    }

    for (const m of this.mines) updateMine(m, dt);
    this.mines = this.mines.filter((m) => m.alive);
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  getEnemyBounds(e) {
    switch (e.type) {
      case 'lander': return landerBounds(e);
      case 'mutant': return mutantBounds(e);
      case 'bomber': return bomberBounds(e);
      case 'baiter': return baiterBounds(e);
      case 'pod': return podBounds(e);
      case 'swarmer': return swarmerBounds(e);
      default: return { x: e.x, y: e.y, w: 0, h: 0 };
    }
  }

  checkCollisions() {
    const playerRect = this.player.getBounds();
    const carrying = this.player.carryingHumanoid;

    for (const p of this.projectiles) {
      if (!p.alive) continue;

      if (p.owner === 'player') {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const bounds = this.getEnemyBounds(e);
          if (projectileHitsRect(p, bounds)) {
            p.alive = false;
            e.flash = CONFIG.juice.flashDuration;
            this.hitEnemy(e);
            break;
          }
        }
        for (const m of this.mines) {
          if (!m.alive) continue;
          if (projectileHitsRect(p, mineBounds(m))) {
            p.alive = false;
            m.alive = false;
            this.addScore(CONFIG.scoring.mine);
            this.particles.burst(m.x, m.y, CONFIG.juice.hitParticleCount, CONFIG.colors.mine, 80);
            this.audio.play('smallExplosion');
          }
        }
      } else if (
        p.owner === 'enemy' &&
        this.player.alive &&
        this.player.invuln <= 0 &&
        projectileHitsRect(p, playerRect)
      ) {
        p.alive = false;
        this.hitPlayer();
      }
    }

    if (
      this.player.alive &&
      this.player.invuln <= 0 &&
      !carrying &&
      !CONFIG.debug.godMode
    ) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (rectsOverlap(playerRect, this.getEnemyBounds(e))) {
          this.hitPlayer();
          break;
        }
      }
      for (const m of this.mines) {
        if (!m.alive) continue;
        if (rectsOverlap(playerRect, mineBounds(m))) {
          this.hitPlayer();
          break;
        }
      }
    }
  }

  hitEnemy(e) {
    this.triggerJuice(e.x, e.y, CONFIG.juice.hitPauseMs, CONFIG.juice.shakeHit, CONFIG.colors[e.type] || '#fff', 'smallExplosion');
    e.alive = false;

    if (e.type === 'pod') {
      const swarmers = splitPod(e);
      this.enemies.push(...swarmers);
      for (const s of swarmers) this.particles.spawn(s.x, s.y, CONFIG.colors.swarmer);
    }

    if (e.type === 'lander') {
      releaseGrabbedHumanoid(e);
    }

    const scoreKey = e.type === 'mine' ? 'mine' : e.type;
    this.addScore(CONFIG.scoring[scoreKey] || CONFIG.enemies[e.type]?.score || 100);
  }

  destroyEnemy(e, awardScore = true) {
    e.alive = false;
    this.particles.burst(e.x, e.y, CONFIG.juice.deathParticleCount, CONFIG.colors[e.type] || '#fff', 120);
    if (e.type === 'lander') releaseGrabbedHumanoid(e);
    if (e.type === 'pod') {
      this.enemies.push(...splitPod(e));
    }
    if (awardScore) {
      this.addScore(CONFIG.scoring[e.type] || 100);
    }
  }

  hitPlayer() {
    if (CONFIG.debug.godMode) return;
    dropCarriedHumanoid(this.player);
    this.killPlayer();
  }

  killPlayer() {
    const px = this.player.x;
    const py = this.player.y;

    this.triggerJuice(px, py, CONFIG.juice.hitPausePlayerMs, CONFIG.juice.shakeDeath, CONFIG.colors.player, 'playerDeath');
    this.particles.burst(px, py, CONFIG.juice.deathParticleCount * 2, CONFIG.colors.player, 180, 0.8);
    this.particles.burst(px, py, CONFIG.juice.deathParticleCount, '#ffffff', 120, 0.5);
    this.world.addShake(CONFIG.juice.shakeDeath, CONFIG.juice.playerDeathDuration);

    this.deathExplosions.push({
      x: px,
      y: py,
      radius: 6,
      life: CONFIG.juice.playerDeathDuration,
      maxLife: CONFIG.juice.playerDeathDuration,
    });

    this.player.kill();
    this.player.lives--;

    if (this.player.lives <= 0) {
      this.respawnTimer = 0;
      setTimeout(() => this.gameOver(), 1500);
    } else {
      this.respawnTimer = CONFIG.player.respawnDelay;
    }
    this.updateHUD();
  }

  revivePlayer() {
    this.player.respawn();
    this.clearCombat();
    this.enemyRespawnTimer = CONFIG.player.enemyRespawnDelay;
    this.waves.suspendCombat();
    this.deathExplosions = [];
  }

  clearCombat() {
    this.enemies = [];
    this.mines = [];
    this.projectiles = [];
    for (const h of this.humanoids) {
      if (h.state === 'grabbed') {
        h.state = 'falling';
        h.fallSpeed = CONFIG.humanoid.fallSpeed;
      }
    }
  }

  updateHumanoidsOnly(dt) {
    for (const h of this.humanoids) {
      const result = updateHumanoid(h, dt, this.player);
      if (result === 'death') {
        this.audio.play('humanoidDeath');
        this.particles.burst(h.x, h.y, 8, CONFIG.colors.humanoid, 50);
      }
    }
  }

  triggerJuice(x, y, pauseMs, shake, color, sound) {
    this.hitPause = pauseMs;
    this.world.addShake(shake, 0.3);
    this.particles.burst(x, y, CONFIG.juice.deathParticleCount, color, 140);
    this.audio.play(sound);
  }

  updateDeathExplosions(dt) {
    for (let i = this.deathExplosions.length - 1; i >= 0; i--) {
      const ex = this.deathExplosions[i];
      ex.life -= dt;
      ex.radius += 120 * dt;
      if (ex.life <= 0) this.deathExplosions.splice(i, 1);
    }
  }

  checkPlanetLoss() {
    if (this.planetDestroyed) return;
    if (livingHumanoidCount(this.humanoids) <= 0) {
      this.planetDestroyed = true;
      this.planetDestroyTimer = CONFIG.planet.destructionDuration;
      this.audio.play('planetDestroy');
      this.world.addShake(CONFIG.juice.shakeDeath, CONFIG.planet.destructionDuration);
    }
  }

  draw() {
    const ctx = this.ctx;
    this.world.draw(ctx);

    for (const m of this.mines) drawMine(ctx, this.world, m);
    for (const h of this.humanoids) drawHumanoid(ctx, this.world, h);

    for (const e of this.enemies) {
      switch (e.type) {
        case 'lander': drawLander(ctx, this.world, e); break;
        case 'mutant': drawMutant(ctx, this.world, e); break;
        case 'bomber': drawBomber(ctx, this.world, e); break;
        case 'baiter': drawBaiter(ctx, this.world, e); break;
        case 'pod': drawPod(ctx, this.world, e); break;
        case 'swarmer': drawSwarmer(ctx, this.world, e); break;
        default: break;
      }
    }

    for (const p of this.projectiles) drawProjectile(ctx, this.world, p);

    for (const ex of this.deathExplosions) {
      const sx = this.world.toScreenX(ex.x);
      const alpha = ex.life / ex.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = CONFIG.colors.player;
      ctx.lineWidth = 2;
      ctx.shadowColor = CONFIG.colors.player;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, ex.y, ex.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(sx, ex.y, ex.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.player.draw(ctx, this.world);
    this.particles.draw(ctx, this.world);

    if (this.smartBombFlash > 0) {
      ctx.fillStyle = CONFIG.colors.smartBombFlash;
      ctx.globalAlpha = Math.min(1, this.smartBombFlash * 3) * 0.7;
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.globalAlpha = 1;
    }

    if (this.planetDestroyTimer > 0) {
      ctx.fillStyle = '#ff2200';
      ctx.globalAlpha = 0.2 + Math.random() * 0.3;
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = CONFIG.colors.player;
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('PLANET DESTROYED', CONFIG.canvas.width / 2, 40);
    }

    if (this.waves.waveClearPending) {
      ctx.fillStyle = CONFIG.colors.player;
      ctx.font = 'bold 18px Courier New';
      ctx.textAlign = 'center';
      ctx.shadowColor = CONFIG.colors.player;
      ctx.shadowBlur = 10;
      ctx.fillText(`WAVE ${this.waves.wave} CLEARED`, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
      ctx.shadowBlur = 0;
    }

    if (this.enemyRespawnTimer > 0) {
      ctx.fillStyle = CONFIG.colors.player;
      ctx.font = 'bold 16px Courier New';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(performance.now() * 0.008);
      ctx.fillText('GET READY', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
      ctx.globalAlpha = 1;
    }

    this.radar.draw({
      player: this.player,
      humanoids: this.humanoids,
      enemies: this.enemies,
      mines: this.mines,
      planetDestroyed: this.planetDestroyed,
    });
  }
}

export function createGameLoop(game) {
  let lastTime = 0;
  const step = 1 / 60;

  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000 || step);
    lastTime = time;
    game.update(dt);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
