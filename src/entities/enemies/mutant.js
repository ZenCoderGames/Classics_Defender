import { CONFIG } from '../../config.js';
import { shortestX, wrapX } from '../../world.js';
import { createEnemyBullet } from '../projectile.js';

let nextId = 1;

export function createMutant(x, y, speedMul = 1) {
  const cfg = CONFIG.enemies.mutant;
  return {
    id: nextId++,
    type: 'mutant',
    x: wrapX(x),
    y: y ?? CONFIG.world.skyTop + 80,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    speedMul,
    wobblePhase: Math.random() * Math.PI * 2,
    flash: 0,
    fireTimer: 0.5 + Math.random(),
  };
}

export function updateMutant(e, dt, player, projectiles) {
  if (!e.alive || !player?.alive) return;
  const cfg = CONFIG.enemies.mutant;
  if (e.flash > 0) e.flash -= dt;

  const tx = shortestX(e.x, player.x);
  const dx = tx - e.x;
  const dy = player.y - e.y;
  const len = Math.hypot(dx, dy) || 1;

  e.wobblePhase += dt * cfg.wobble;
  const wobbleX = Math.sin(e.wobblePhase) * 40;
  const wobbleY = Math.cos(e.wobblePhase * 1.3) * 30;

  e.x = wrapX(e.x + (dx / len) * cfg.speed * e.speedMul * dt + wobbleX * dt);
  e.y += (dy / len) * cfg.speed * e.speedMul * dt + wobbleY * dt;
  e.y = Math.max(CONFIG.world.skyTop, Math.min(CONFIG.world.groundY - 20, e.y));

  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = CONFIG.enemies.enemyBullet.cooldown * 0.7;
    projectiles.push(createEnemyBullet(e.x, e.y, (dx / len) * CONFIG.enemies.enemyBullet.speed * 1.1, (dy / len) * CONFIG.enemies.enemyBullet.speed * 1.1));
  }
}

export function drawMutant(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.mutant;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(sx, e.y - e.h / 2);
  ctx.lineTo(sx + e.w / 2, e.y);
  ctx.lineTo(sx, e.y + e.h / 2);
  ctx.lineTo(sx - e.w / 2, e.y);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx - 4, e.y - 2);
  ctx.lineTo(sx + 4, e.y + 2);
  ctx.moveTo(sx + 4, e.y - 2);
  ctx.lineTo(sx - 4, e.y + 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function enemyBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}
