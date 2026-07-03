import { CONFIG } from '../../config.js';
import { shortestX, wrapX } from '../../world.js';
import { createEnemyBullet } from '../projectile.js';

let nextId = 1;

export function createBaiter(x, y, speedMul = 1) {
  const cfg = CONFIG.enemies.baiter;
  return {
    id: nextId++,
    type: 'baiter',
    x: wrapX(x),
    y: y ?? CONFIG.world.skyTop + 60,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    speedMul,
    flash: 0,
    fireTimer: 0.3,
  };
}

export function updateBaiter(e, dt, player, projectiles) {
  if (!e.alive || !player?.alive) return;
  const cfg = CONFIG.enemies.baiter;
  if (e.flash > 0) e.flash -= dt;

  const tx = shortestX(e.x, player.x);
  const dx = tx - e.x;
  const dy = player.y - e.y;
  const len = Math.hypot(dx, dy) || 1;

  e.x = wrapX(e.x + (dx / len) * cfg.speed * e.speedMul * dt);
  e.y += (dy / len) * cfg.speed * e.speedMul * dt;
  e.y = Math.max(CONFIG.world.skyTop, Math.min(CONFIG.world.groundY - 20, e.y));

  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = CONFIG.enemies.enemyBullet.cooldown * 0.5;
    projectiles.push(createEnemyBullet(e.x, e.y, (dx / len) * CONFIG.enemies.enemyBullet.speed * 1.3, (dy / len) * CONFIG.enemies.enemyBullet.speed * 1.3));
  }
}

export function drawBaiter(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.baiter;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(sx - e.w / 2, e.y);
  ctx.lineTo(sx, e.y - e.h / 2);
  ctx.lineTo(sx + e.w / 2, e.y);
  ctx.lineTo(sx, e.y + e.h / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function enemyBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}
