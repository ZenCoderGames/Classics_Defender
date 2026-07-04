import { CONFIG } from './config.js';

export function wrapX(x) {
  const w = CONFIG.world.width;
  return ((x % w) + w) % w;
}

export function wrapDelta(fromX, toX) {
  const w = CONFIG.world.width;
  let d = toX - fromX;
  if (d > w / 2) d -= w;
  if (d < -w / 2) d += w;
  return d;
}

export function shortestX(fromX, toX) {
  return fromX + wrapDelta(fromX, toX);
}

function terrainHash(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function sampleTerrainOffset(worldX) {
  const cfg = CONFIG.terrain;
  const cell = Math.floor(worldX / cfg.stepSize);
  const h = terrainHash(cell * 17.31 + cell * 0.13);
  const level = Math.floor(h * cfg.peakLevels);
  const t = level / Math.max(1, cfg.peakLevels - 1);
  return Math.round(cfg.valleyDepth - t * (cfg.valleyDepth + cfg.peakHeight));
}

function buildTerrainProfile() {
  const { width } = CONFIG.world;
  const step = CONFIG.terrain.stepSize;
  const count = Math.ceil(width / step);
  const offsets = new Array(count);
  for (let i = 0; i < count; i++) {
    offsets[i] = sampleTerrainOffset(i * step);
  }
  return { step, offsets, count };
}

const terrainProfile = buildTerrainProfile();

export function terrainOffsetAt(worldX) {
  const x = wrapX(worldX);
  const { step, offsets } = terrainProfile;
  const idx = Math.floor(x / step) % offsets.length;
  return offsets[idx];
}

export function terrainYAt(worldX) {
  return CONFIG.world.groundY + terrainOffsetAt(worldX);
}

export function humanoidGroundY() {
  return CONFIG.world.humanoidGroundY;
}

export class World {
  constructor() {
    this.cameraX = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDecay = 0;
    this.stars = this.generateStars(CONFIG.stars.count);
  }

  generateStars(count) {
    const stars = [];
    const cfg = CONFIG.stars;
    const maxY = CONFIG.world.groundY - 50;

    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      const radius = cfg.minRadius + Math.random() * (cfg.maxRadius - cfg.minRadius);
      stars.push({
        x: Math.random() * CONFIG.world.width,
        y: 16 + Math.random() * maxY,
        radius,
        brightness: 0.35 + Math.random() * 0.55,
        twinkleSpeed: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        soft: roll > 0.82,
      });
    }
    return stars;
  }

  update(dt, playerX) {
    const target = playerX - CONFIG.canvas.width / 2;
    this.cameraX = wrapX(this.cameraX + wrapDelta(this.cameraX, target) * CONFIG.camera.followLerp);

    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt;
      const mag = this.shakeDecay > 0 ? (this.shakeDecay / 0.3) : 0;
      this.shakeX = (Math.random() - 0.5) * this.shakeMagnitude * mag;
      this.shakeY = (Math.random() - 0.5) * this.shakeMagnitude * mag;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  addShake(magnitude, duration = 0.3) {
    this.shakeMagnitude = magnitude;
    this.shakeDecay = Math.max(this.shakeDecay, duration);
  }

  toScreenX(worldX) {
    let sx = worldX - this.cameraX + this.shakeX;
    const vw = CONFIG.canvas.width;
    if (sx < -vw / 2) sx += CONFIG.world.width;
    if (sx > vw + vw / 2) sx -= CONFIG.world.width;
    return sx;
  }

  isOnScreen(worldX, margin = 40) {
    const sx = this.toScreenX(worldX);
    return sx >= -margin && sx <= CONFIG.canvas.width + margin;
  }

  worldFromScreen(screenX) {
    return wrapX(this.cameraX + screenX - this.shakeX);
  }

  draw(ctx) {
    const { width, height } = CONFIG.canvas;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#04060e');
    sky.addColorStop(0.55, '#020402');
    sky.addColorStop(1, '#010201');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    this.drawStars(ctx);
    this.drawTerrain(ctx);
  }

  drawStars(ctx) {
    const t = performance.now() * 0.001;
    for (const star of this.stars) {
      const sx = this.toScreenX(star.x);
      if (sx < -8 || sx > CONFIG.canvas.width + 8) continue;

      const twinkle = 0.75 + 0.25 * Math.sin(t * star.twinkleSpeed + star.phase);
      const alpha = star.brightness * twinkle;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = star.soft ? 3 : star.radius > 1.6 ? 2 : 0;

      ctx.beginPath();
      ctx.arc(sx, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();

      if (star.radius > 1.4 && !star.soft) {
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.arc(sx, star.y, star.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  collectVisibleTerrainPoints() {
    const step = CONFIG.terrain.stepSize;
    const margin = step * 3;
    const startX = Math.floor((this.cameraX - margin) / step) * step;
    const endX = this.cameraX + CONFIG.canvas.width + margin;
    const points = [];

    for (let wx = startX; wx <= endX; wx += step) {
      const wrappedX = wrapX(wx);
      const sx = this.toScreenX(wx);
      if (sx < -step * 2 || sx > CONFIG.canvas.width + step * 2) continue;
      points.push({ sx, y: terrainYAt(wrappedX) });
    }

    return points;
  }

  drawTerrain(ctx) {
    const points = this.collectVisibleTerrainPoints();
    if (points.length < 2) return;

    ctx.strokeStyle = CONFIG.colors.terrainLine;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(points[0].sx, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].sx, points[i].y);
    }
    ctx.stroke();
  }
}
