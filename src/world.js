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

export class World {
  constructor() {
    this.cameraX = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDecay = 0;
    this.stars = this.generateStars(120);
  }

  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * CONFIG.world.width,
        y: Math.random() * (CONFIG.world.groundY - 20),
        size: Math.random() < 0.3 ? 2 : 1,
        phase: Math.random() * Math.PI * 2,
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
    const { groundY } = CONFIG.world;

    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);

    this.drawStars(ctx);
    this.drawTerrain(ctx, groundY);
  }

  drawStars(ctx) {
    const t = performance.now() * 0.001;
    for (const star of this.stars) {
      const sx = this.toScreenX(star.x);
      if (sx < -4 || sx > CONFIG.canvas.width + 4) continue;
      const blink = 0.5 + 0.5 * Math.sin(t * 2 + star.phase);
      ctx.fillStyle = star.size > 1 ? CONFIG.colors.starBright : CONFIG.colors.star;
      ctx.globalAlpha = 0.4 + blink * 0.4;
      ctx.fillRect(sx, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  }

  drawTerrain(ctx, groundY) {
    ctx.strokeStyle = CONFIG.colors.terrainLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.canvas.width, groundY);
    ctx.stroke();

    ctx.fillStyle = CONFIG.colors.terrain;
    ctx.fillRect(0, groundY + 1, CONFIG.canvas.width, CONFIG.canvas.height - groundY - 1);
  }
}

export function terrainYAt(_worldX) {
  return CONFIG.world.groundY;
}
