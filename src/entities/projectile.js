import { CONFIG } from '../config.js';
import { wrapX } from '../world.js';

let nextId = 1;

export function createLaser(x, y, direction, owner = 'player') {
  const cfg = owner === 'player' ? CONFIG.laser : CONFIG.enemies.enemyBullet;
  return {
    id: nextId++,
    type: 'laser',
    owner,
    x,
    y,
    vx: direction * (cfg.speed || CONFIG.laser.speed),
    vy: 0,
    w: owner === 'player' ? CONFIG.laser.width : cfg.radius * 2,
    h: owner === 'player' ? CONFIG.laser.height : cfg.radius * 2,
    alive: true,
    flash: 0,
    distanceTraveled: 0,
    maxRange: owner === 'player' ? CONFIG.laser.maxRange : null,
  };
}

export function createEnemyBullet(x, y, vx, vy) {
  const cfg = CONFIG.enemies.enemyBullet;
  return {
    id: nextId++,
    type: 'enemyBullet',
    owner: 'enemy',
    x,
    y,
    vx,
    vy,
    w: cfg.radius * 2,
    h: cfg.radius * 2,
    alive: true,
    flash: 0,
  };
}

export function updateProjectile(p, dt) {
  if (!p.alive) return;
  p.x = wrapX(p.x + p.vx * dt);
  p.y += p.vy * dt;
  if (p.flash > 0) p.flash -= dt;

  if (p.owner === 'player' && p.maxRange != null) {
    p.distanceTraveled += Math.abs(p.vx * dt);
    if (p.distanceTraveled >= p.maxRange) {
      p.alive = false;
      return;
    }
  }

  if (p.y < CONFIG.world.skyTop - 20 || p.y > CONFIG.world.groundY + 20) {
    p.alive = false;
  }
}

export function drawProjectile(ctx, world, p) {
  if (!p.alive) return;
  const sx = world.toScreenX(p.x);
  if (sx < -20 || sx > CONFIG.canvas.width + 20) return;

  const color = p.owner === 'player'
    ? (p.flash > 0 ? '#fff' : CONFIG.colors.laser)
    : (p.flash > 0 ? '#fff' : CONFIG.colors.enemyLaser);

  ctx.strokeStyle = color;
  ctx.lineWidth = p.type === 'laser' ? 2 : 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  if (p.type === 'laser') {
    const hw = p.w / 2;
    ctx.beginPath();
    ctx.moveTo(sx - hw, p.y);
    ctx.lineTo(sx + hw, p.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(sx, p.y, p.w / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

export function projectileHitsRect(p, rect) {
  if (!p.alive) return false;
  const offsets = [0, CONFIG.world.width, -CONFIG.world.width];
  for (const off of offsets) {
    if (
      p.x >= rect.x + off &&
      p.x <= rect.x + off + rect.w &&
      p.y >= rect.y &&
      p.y <= rect.y + rect.h
    ) {
      return true;
    }
  }
  return false;
}

export function rectsOverlap(a, b) {
  const offsets = [0, CONFIG.world.width, -CONFIG.world.width];
  for (const off of offsets) {
    if (a.x < b.x + off + b.w && a.x + a.w > b.x + off && a.y < b.y + b.h && a.y + a.h > b.y) {
      return true;
    }
  }
  return false;
}
