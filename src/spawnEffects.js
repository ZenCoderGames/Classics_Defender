import { CONFIG } from './config.js';

let nextId = 1;

function easeInCubic(t) {
  return t * t * t;
}

export class SpawnEffectSystem {
  constructor() {
    this.pending = [];
  }

  clear() {
    this.pending = [];
  }

  isActive() {
    return this.pending.length > 0;
  }

  queue(worldX, worldY, color, onComplete) {
    const cfg = CONFIG.enemySpawn;
    const particles = [];

    for (let i = 0; i < cfg.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / cfg.particleCount + Math.random() * 0.6;
      const dist = cfg.startRadius * (0.65 + Math.random() * 0.35);
      particles.push({
        angle,
        startDist: dist,
        size: 1 + Math.random() * 2,
      });
    }

    this.pending.push({
      id: nextId++,
      x: worldX,
      y: worldY,
      color,
      particles,
      life: cfg.duration,
      maxLife: cfg.duration,
      onComplete,
      flash: 0,
    });
  }

  update(dt) {
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const spawn = this.pending[i];
      spawn.life -= dt;

      if (spawn.life <= 0) {
        spawn.onComplete();
        this.pending.splice(i, 1);
      }
    }
  }

  draw(ctx, world) {
    const cfg = CONFIG.enemySpawn;

    for (const spawn of this.pending) {
      const progress = 1 - spawn.life / spawn.maxLife;
      const eased = easeInCubic(progress);
      const sx = world.toScreenX(spawn.x);

      for (const p of spawn.particles) {
        const dist = p.startDist * (1 - eased);
        const px = spawn.x + Math.cos(p.angle) * dist;
        const py = spawn.y + Math.sin(p.angle) * dist;
        const psx = world.toScreenX(px);
        const alpha = 0.35 + eased * 0.65;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = spawn.color;
        ctx.shadowColor = spawn.color;
        ctx.shadowBlur = 6 + eased * 8;
        ctx.fillRect(psx - p.size / 2, py - p.size / 2, p.size, p.size);
      }

      if (progress > 0.75) {
        const flashAlpha = (progress - 0.75) / 0.25;
        ctx.globalAlpha = flashAlpha * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = spawn.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(sx, spawn.y, 4 + flashAlpha * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
