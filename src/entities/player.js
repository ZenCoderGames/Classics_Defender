import { CONFIG } from '../config.js';
import { wrapX, humanoidGroundY } from '../world.js';
import { createLaser } from './projectile.js';

function approachSpeed(current, target, rate, dt) {
  if (current === target) return current;
  const delta = rate * dt;
  if (target > current) return Math.min(current + delta, target);
  return Math.max(current - delta, target);
}

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    const cfg = CONFIG.player;
    this.x = CONFIG.world.width / 2;
    this.y = cfg.respawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.alive = true;
    this.lives = cfg.startLives;
    this.bombs = cfg.startBombs;
    this.invuln = 0;
    this.fireTimer = 0;
    this.hyperspaceCooldown = 0;
    this.flash = 0;
    this.thrusting = false;
    this.carryingHumanoid = null;
  }

  update(dt, input, world) {
    if (!this.alive) return;

    const cfg = CONFIG.player;
    const move = input.getMovement();

    if (input.reverse()) {
      this.facing *= -1;
    }

    if (move.dx !== 0) {
      this.facing = move.dx > 0 ? 1 : -1;
    }

    this.vx = approachSpeed(this.vx, move.dx * cfg.speedX, move.dx !== 0 ? cfg.accelX : cfg.decelX, dt);
    this.vy = approachSpeed(this.vy, move.dy * cfg.speedY, move.dy !== 0 ? cfg.accelY : cfg.decelY, dt);
    this.thrusting = move.dx !== 0 || move.dy !== 0;

    this.x = wrapX(this.x + this.vx * dt);
    const maxY = this.carryingHumanoid
      ? humanoidGroundY() - CONFIG.humanoid.carryDropPlayerOffset
      : CONFIG.canvas.height - CONFIG.player.bottomMargin;
    this.y = Math.max(CONFIG.world.skyTop, Math.min(maxY, this.y + this.vy * dt));

    if (this.invuln > 0) this.invuln -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.hyperspaceCooldown > 0) this.hyperspaceCooldown -= dt;
    if (this.flash > 0) this.flash -= dt;
  }

  tryFire(projectiles) {
    if (!this.alive || this.fireTimer > 0) return null;
    const active = projectiles.filter((p) => p.owner === 'player' && p.alive).length;
    if (active >= CONFIG.player.maxActiveShots) return null;

    this.fireTimer = CONFIG.player.fireCooldown;
    const laser = createLaser(this.x, this.y, this.facing);
    projectiles.push(laser);
    return laser;
  }

  hyperspace(world) {
    if (!this.alive || this.hyperspaceCooldown > 0) return 'blocked';

    this.hyperspaceCooldown = CONFIG.hyperspace.cooldown;
    if (Math.random() < CONFIG.hyperspace.failChance) {
      return 'fail';
    }

    this.x = wrapX(Math.random() * CONFIG.world.width);
    this.y = CONFIG.world.skyTop + 40 + Math.random() * (CONFIG.canvas.height - CONFIG.world.skyTop - 80);
    return 'success';
  }

  kill() {
    this.alive = false;
    this.carryingHumanoid = null;
  }

  respawn() {
    const cfg = CONFIG.player;
    this.x = wrapX(this.x);
    this.y = cfg.respawnY;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
    this.invuln = cfg.invulnTime;
    this.carryingHumanoid = null;
  }

  draw(ctx, world) {
    if (!this.alive) return;

    const sx = world.toScreenX(this.x);
    const sy = this.y;
    const w = CONFIG.player.width;
    const h = CONFIG.player.height;
    const dir = this.facing;

    const flicker = this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0;
    if (flicker) return;

    const color = this.flash > 0 ? '#ffffff' : CONFIG.colors.player;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(sx + dir * w * 0.5, sy);
    ctx.lineTo(sx - dir * w * 0.35, sy - h * 0.5);
    ctx.lineTo(sx - dir * w * 0.15, sy);
    ctx.lineTo(sx - dir * w * 0.35, sy + h * 0.5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx - dir * w * 0.1, sy - h * 0.25);
    ctx.lineTo(sx - dir * w * 0.1, sy + h * 0.25);
    ctx.stroke();

    if (this.thrusting) {
      ctx.strokeStyle = CONFIG.colors.playerAlt;
      ctx.beginPath();
      ctx.moveTo(sx - dir * w * 0.45, sy);
      ctx.lineTo(sx - dir * w * 0.75 - Math.random() * 4, sy + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  getBounds() {
    const w = CONFIG.player.width;
    const h = CONFIG.player.height;
    return { x: this.x - w / 2, y: this.y - h / 2, w, h };
  }
}
