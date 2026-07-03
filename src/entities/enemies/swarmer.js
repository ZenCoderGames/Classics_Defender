import { CONFIG } from '../../config.js';
import { shortestX, wrapX } from '../../world.js';

let nextId = 1;

export function createSwarmer(x, y, dirX = 0, dirY = 0, speedMul = 1) {
  const cfg = CONFIG.enemies.swarmer;
  const len = Math.hypot(dirX, dirY) || 1;
  return {
    id: nextId++,
    type: 'swarmer',
    x: wrapX(x),
    y,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    speedMul,
    wobblePhase: Math.random() * Math.PI * 2,
    dirX: dirX / len,
    dirY: dirY / len,
    flash: 0,
  };
}

export function updateSwarmer(e, dt, player) {
  if (!e.alive) return;
  const cfg = CONFIG.enemies.swarmer;
  if (e.flash > 0) e.flash -= dt;

  e.wobblePhase += dt * cfg.wobble;

  let dx = e.dirX;
  let dy = e.dirY;

  if (player?.alive) {
    const tx = shortestX(e.x, player.x);
    dx = tx - e.x;
    dy = player.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
  }

  const wobbleX = Math.sin(e.wobblePhase) * 60;
  const wobbleY = Math.cos(e.wobblePhase * 1.5) * 40;

  e.x = wrapX(e.x + (dx * cfg.speed * e.speedMul + wobbleX) * dt);
  e.y += (dy * cfg.speed * e.speedMul + wobbleY) * dt;
  e.y = Math.max(CONFIG.world.skyTop, Math.min(CONFIG.world.groundY - 10, e.y));
}

export function drawSwarmer(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.swarmer;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;

  ctx.beginPath();
  ctx.moveTo(sx, e.y - e.h / 2);
  ctx.lineTo(sx + e.w / 2, e.y + e.h / 2);
  ctx.lineTo(sx - e.w / 2, e.y + e.h / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function enemyBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}
