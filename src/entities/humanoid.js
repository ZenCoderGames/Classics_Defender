import { CONFIG } from '../config.js';
import { humanoidGroundY, wrapX } from '../world.js';

let nextId = 1;

export function createHumanoids(count) {
  const humanoids = [];
  const { spacing, startOffset } = CONFIG.humanoid;
  for (let i = 0; i < count; i++) {
    const x = wrapX(startOffset + i * spacing);
    humanoids.push(createHumanoid(x));
  }
  return humanoids;
}

export function createHumanoid(x) {
  const y = humanoidGroundY() - CONFIG.humanoid.height;
  return {
    id: nextId++,
    x,
    y,
    state: 'standing',
    fallSpeed: 0,
    flash: 0,
    alive: true,
    rescued: false,
    waveBonus: true,
  };
}

export function updateHumanoid(h, dt, player) {
  if (!h.alive) return;

  if (h.flash > 0) h.flash -= dt;

  if (h.state === 'standing') {
    h.y = humanoidGroundY() - CONFIG.humanoid.height;
  } else if (h.state === 'grabbed') {
    // position set by lander
  } else if (h.state === 'falling') {
    h.y += CONFIG.humanoid.fallSpeed * dt;

    if (player && player.alive && player.carryingHumanoid !== h) {
      const dx = Math.abs(wrapX(h.x) - wrapX(player.x));
      const distX = Math.min(dx, CONFIG.world.width - dx);
      const dy = Math.abs(h.y - player.y);
      if (distX < CONFIG.humanoid.catchRadius && dy < CONFIG.humanoid.catchRadius) {
        h.state = 'carried';
        h.fallSpeed = 0;
        player.carryingHumanoid = h;
      }
    }

    const ground = humanoidGroundY() - CONFIG.humanoid.height;
    if (h.y >= ground) {
      if (CONFIG.humanoid.fallSpeed > CONFIG.humanoid.safeFallSpeed) {
        h.alive = false;
        h.state = 'dead';
        return 'death';
      }
      h.y = ground;
      h.state = 'standing';
      h.fallSpeed = 0;
      return 'landed';
    }
  } else if (h.state === 'carried') {
    if (player && player.alive) {
      h.x = player.x;
      h.y = player.y + CONFIG.humanoid.carryOffsetY;
    }
  }

  return null;
}

export function dropCarriedHumanoid(player) {
  if (!player.carryingHumanoid) return null;
  const h = player.carryingHumanoid;
  h.state = 'falling';
  h.fallSpeed = CONFIG.humanoid.fallSpeed;
  player.carryingHumanoid = null;
  return h;
}

export function canDropCarriedHumanoid(player) {
  if (!player?.carryingHumanoid) return false;
  const humanoidBottom = player.y + CONFIG.humanoid.carryOffsetY + 6;
  return humanoidBottom >= humanoidGroundY() - CONFIG.humanoid.dropProximity;
}

export function releaseHumanoidToGround(h) {
  h.state = 'standing';
  h.y = humanoidGroundY() - CONFIG.humanoid.height;
  h.fallSpeed = 0;
}

export function drawHumanoid(ctx, world, h) {
  if (!h.alive) return;

  const sx = world.toScreenX(h.x);
  if (sx < -10 || sx > CONFIG.canvas.width + 10) return;

  const color = h.flash > 0
    ? '#ffffff'
    : h.state === 'grabbed'
      ? CONFIG.colors.humanoidGrabbed
      : CONFIG.colors.humanoid;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;

  const bob = h.state === 'standing' ? Math.sin(performance.now() * 0.005 + h.id) * 1.5 : 0;
  const hy = h.y + bob;

  ctx.beginPath();
  ctx.arc(sx, hy - 6, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, hy - 3);
  ctx.lineTo(sx, hy + 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx - 3, hy);
  ctx.lineTo(sx + 3, hy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, hy + 2);
  ctx.lineTo(sx - 2, hy + 6);
  ctx.moveTo(sx, hy + 2);
  ctx.lineTo(sx + 2, hy + 6);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

export function livingHumanoidCount(humanoids) {
  return humanoids.filter((h) => h.alive).length;
}
