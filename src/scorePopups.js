import { CONFIG } from './config.js';

let nextId = 1;

export class ScorePopupSystem {
  constructor() {
    this.popups = [];
  }

  clear() {
    this.popups = [];
  }

  spawn(worldX, worldY, points) {
    const cfg = CONFIG.scorePopup;
    this.popups.push({
      id: nextId++,
      x: worldX,
      y: worldY,
      text: `+${points}`,
      life: cfg.duration,
      maxLife: cfg.duration,
      hueOffset: Math.random() * 360,
    });
  }

  update(dt) {
    const cfg = CONFIG.scorePopup;
    for (const p of this.popups) {
      p.life -= dt;
      p.y -= cfg.floatSpeed * dt;
      p.hueOffset += cfg.hueSpeed * dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
  }

  draw(ctx, world) {
    const cfg = CONFIG.scorePopup;
    ctx.save();
    ctx.font = `bold ${cfg.fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'middle';

    for (const p of this.popups) {
      const sx = world.toScreenX(p.x);
      if (sx < -60 || sx > CONFIG.canvas.width + 60) continue;

      const alpha = Math.min(1, p.life / (p.maxLife * 0.6));
      const chars = p.text.split('');
      const widths = chars.map((c) => ctx.measureText(c).width);
      const totalWidth = widths.reduce((sum, w) => sum + w, 0);
      let cx = sx - totalWidth / 2;

      for (let i = 0; i < chars.length; i++) {
        const hue = (p.hueOffset + i * 55) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 68%, ${alpha})`;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'left';
        ctx.fillText(chars[i], cx, p.y);
        cx += widths[i];
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
