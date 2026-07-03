import { CONFIG } from './config.js';

let nextId = 1;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  burst(x, y, count, color, speed = 120, life = 0.5) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        id: nextId++,
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  trail(x, y, color, count = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: nextId++,
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.25,
        maxLife: 0.25,
        color,
        size: 1,
      });
    }
  }

  shot(x, y, dir, color) {
    this.particles.push({
      id: nextId++,
      x,
      y,
      vx: dir * 40,
      vy: (Math.random() - 0.5) * 20,
      life: 0.15,
      maxLife: 0.15,
      color,
      size: 2,
    });
  }

  spawn(x, y, color) {
    this.burst(x, y, CONFIG.juice.spawnParticleCount, color, 60, 0.4);
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx, world) {
    for (const p of this.particles) {
      const sx = world.toScreenX(p.x);
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fillRect(sx - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
