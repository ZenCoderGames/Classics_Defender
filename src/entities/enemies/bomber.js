import { CONFIG } from '../../config.js';
import { wrapX } from '../../world.js';

let nextId = 1;

export function createBomber(x, y, speedMul = 1) {
  const cfg = CONFIG.enemies.bomber;
  return {
    id: nextId++,
    type: 'bomber',
    x: wrapX(x),
    y: y ?? CONFIG.world.skyTop + 100 + Math.random() * 80,
    vx: (Math.random() < 0.5 ? -1 : 1) * cfg.speed * speedMul,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    speedMul,
    mineTimer: cfg.mineInterval * (0.5 + Math.random()),
    flash: 0,
  };
}

export function createMine(x, y) {
  const cfg = CONFIG.enemies.mine;
  return {
    id: nextId++,
    type: 'mine',
    x: wrapX(x),
    y,
    vx: (Math.random() - 0.5) * cfg.driftSpeed,
    vy: (Math.random() - 0.5) * cfg.driftSpeed * 0.5,
    radius: cfg.radius,
    lifetime: cfg.lifetime,
    alive: true,
    flash: 0,
  };
}

export function updateBomber(e, dt, mines) {
  if (!e.alive) return;
  const cfg = CONFIG.enemies.bomber;
  if (e.flash > 0) e.flash -= dt;

  e.x = wrapX(e.x + e.vx * dt);
  e.y += Math.sin(performance.now() * 0.0015 + e.id) * 15 * dt;
  e.y = Math.max(CONFIG.world.skyTop + 40, Math.min(CONFIG.world.groundY - 60, e.y));

  e.mineTimer -= dt;
  if (e.mineTimer <= 0) {
    e.mineTimer = cfg.mineInterval;
    mines.push(createMine(e.x, e.y + e.h / 2));
  }
}

export function updateMine(m, dt) {
  if (!m.alive) return;
  if (m.flash > 0) m.flash -= dt;
  m.x = wrapX(m.x + m.vx * dt);
  m.y += m.vy * dt;
  m.lifetime -= dt;
  if (m.lifetime <= 0) m.alive = false;
}

export function drawBomber(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.bomber;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  ctx.strokeRect(sx - e.w / 2, e.y - e.h / 2, e.w, e.h);
  ctx.beginPath();
  ctx.moveTo(sx - e.w / 4, e.y);
  ctx.lineTo(sx + e.w / 4, e.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function drawMine(ctx, world, m) {
  if (!m.alive) return;
  const sx = world.toScreenX(m.x);
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.008 + m.id);
  const color = m.flash > 0 ? '#fff' : CONFIG.colors.mine;

  ctx.strokeStyle = color;
  ctx.globalAlpha = pulse;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sx, m.y, m.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx - m.radius, m.y);
  ctx.lineTo(sx + m.radius, m.y);
  ctx.moveTo(sx, m.y - m.radius);
  ctx.lineTo(sx, m.y + m.radius);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function mineBounds(m) {
  const r = m.radius;
  return { x: m.x - r, y: m.y - r, w: r * 2, h: r * 2 };
}

export function enemyBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}
