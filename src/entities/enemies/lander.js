import { CONFIG } from '../../config.js';
import { shortestX, wrapX, humanoidGroundY } from '../../world.js';
import { createEnemyBullet } from '../projectile.js';

let nextId = 1;

export function createLander(x, y, speedMul = 1) {
  const cfg = CONFIG.enemies.lander;
  return {
    id: nextId++,
    type: 'lander',
    x: wrapX(x),
    y: y ?? CONFIG.world.skyTop + 60 + Math.random() * 120,
    vx: (Math.random() < 0.5 ? -1 : 1) * cfg.speed * speedMul,
    vy: 0,
    w: cfg.width,
    h: cfg.height,
    alive: true,
    state: 'patrol',
    targetHumanoid: null,
    abductTimer: 0,
    flash: 0,
    speedMul,
    fireTimer: 1 + Math.random(),
    abductSoundPlayed: false,
  };
}

export function updateLander(e, dt, humanoids, projectiles, player) {
  if (!e.alive) return null;

  const cfg = CONFIG.enemies.lander;
  if (e.flash > 0) e.flash -= dt;

  if (e.state === 'patrol') {
    e.x = wrapX(e.x + e.vx * dt);
    e.y += Math.sin(performance.now() * 0.002 + e.id) * 20 * dt;

    if (!e.targetHumanoid || !e.targetHumanoid.alive) {
      e.targetHumanoid = findNearestStandingHumanoid(e, humanoids);
    }

    if (e.targetHumanoid) {
      const tx = shortestX(e.x, e.targetHumanoid.x);
      const dx = tx - e.x;
      const hoverY = e.targetHumanoid.y - cfg.hoverAboveHumanoid;
      if (
        Math.abs(dx) < cfg.abductAlignX &&
        Math.abs(e.y - hoverY) < cfg.abductAlignY
      ) {
        e.state = 'abducting';
        e.abductTimer = cfg.abductTime;
        e.abductSoundPlayed = false;
      } else {
        e.vx = Math.sign(dx || e.vx) * cfg.speed * e.speedMul;
        e.y += Math.sign(hoverY - e.y) * cfg.speed * 0.75 * e.speedMul * dt;
      }
    }
  } else if (e.state === 'abducting') {
    e.abductTimer -= dt;
    if (e.targetHumanoid && e.targetHumanoid.alive) {
      e.targetHumanoid.state = 'grabbed';
      e.targetHumanoid.x = e.x;
      e.targetHumanoid.y = e.y + e.h / 2 + 4;
    }
    if (e.abductTimer <= 0 && e.targetHumanoid) {
      e.state = 'carrying';
    }
  } else if (e.state === 'carrying') {
    e.y -= cfg.carrySpeed * e.speedMul * dt;
    if (e.targetHumanoid) {
      e.targetHumanoid.x = e.x;
      e.targetHumanoid.y = e.y + e.h / 2 + 4;
    }
    if (e.y <= CONFIG.world.skyTop + 10) {
      return 'mutate';
    }
  }

  const maxY = humanoidGroundY() - CONFIG.humanoid.height - cfg.hoverAboveHumanoid;
  e.y = Math.max(CONFIG.world.skyTop, Math.min(maxY, e.y));

  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && player?.alive) {
    e.fireTimer = CONFIG.enemies.enemyBullet.cooldown;
    const dx = shortestX(e.x, player.x) - e.x;
    const dy = player.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    projectiles.push(createEnemyBullet(e.x, e.y, (dx / len) * CONFIG.enemies.enemyBullet.speed, (dy / len) * CONFIG.enemies.enemyBullet.speed));
  }

  return null;
}

function findNearestStandingHumanoid(lander, humanoids) {
  let best = null;
  let bestDist = Infinity;
  for (const h of humanoids) {
    if (!h.alive || h.state !== 'standing') continue;
    const dx = Math.abs(wrapX(h.x) - wrapX(lander.x));
    const dist = Math.min(dx, CONFIG.world.width - dx);
    if (dist < bestDist) {
      bestDist = dist;
      best = h;
    }
  }
  return best;
}

export function drawLander(ctx, world, e) {
  if (!e.alive) return;
  const sx = world.toScreenX(e.x);
  const color = e.flash > 0 ? '#fff' : CONFIG.colors.lander;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(sx - e.w / 2, e.y);
  ctx.lineTo(sx + e.w / 2, e.y);
  ctx.lineTo(sx + e.w / 3, e.y + e.h / 2);
  ctx.lineTo(sx - e.w / 3, e.y + e.h / 2);
  ctx.closePath();
  ctx.stroke();

  if (e.state === 'abducting' || e.state === 'carrying') {
    ctx.strokeStyle = CONFIG.colors.abductionBeam;
    ctx.beginPath();
    ctx.moveTo(sx, e.y + e.h / 2);
    ctx.lineTo(sx, e.y + e.h / 2 + 30);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

export function landerBounds(e) {
  return { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
}

export function releaseGrabbedHumanoid(e) {
  if (!e.targetHumanoid) return null;
  const h = e.targetHumanoid;
  h.state = 'falling';
  h.fallSpeed = CONFIG.humanoid.fallSpeed;
  e.targetHumanoid = null;
  return h;
}
