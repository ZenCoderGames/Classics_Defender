import { CONFIG } from '../../config.js';
import { wrapX } from '../../world.js';
import { createSwarmer } from './swarmer.js';

let nextId = 1;

export function createPod(x, y, speedMul = 1) {
  const cfg = CONFIG.enemies.pod;
  return {
    id: nextId++,
    type: 'pod',
    x: wrapX(x),
    y: y ?? CONFIG.world.skyTop + 80 + Math.random() * 100,
    vx: (Math.random() < 0.5 ? -1 : 1) * cfg.speed * speedMul,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    speedMul,
    flash: 0,
  };
}

export function updatePod(e, dt) {
  if (!e.alive) return;
  if (e.flash > 0) e.flash -= dt;
  e.x = wrapX(e.x + e.vx * dt);
  e.y += Math.sin(performance.now() * 0.002 + e.id) * 25 * dt;
  e.y = Math.max(CONFIG.world.skyTop + 30, Math.min(CONFIG.world.groundY - 50, e.y));
}

export function splitPod(e) {
  const cfg = CONFIG.enemies.pod;
  const swarmers = [];
  for (let i = 0; i < cfg.swarmerCount; i++) {
    const angle = (Math.PI * 2 * i) / cfg.swarmerCount;
    swarmers.push(createSwarmer(e.x, e.y, Math.cos(angle), Math.sin(angle), e.speedMul));
  }
  return swarmers;
}

export function drawPod(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.pod;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.arc(sx, e.y, e.w / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx - e.w / 3, e.y - e.h / 3);
  ctx.lineTo(sx + e.w / 3, e.y + e.h / 3);
  ctx.moveTo(sx + e.w / 3, e.y - e.h / 3);
  ctx.lineTo(sx - e.w / 3, e.y + e.h / 3);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function enemyBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}
