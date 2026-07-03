import { CONFIG } from './config.js';

const RADAR_COLORS = {
  player: CONFIG.colors.player,
  humanoid: CONFIG.colors.humanoid,
  humanoidGrabbed: CONFIG.colors.humanoidGrabbed,
  lander: CONFIG.colors.lander,
  mutant: CONFIG.colors.mutant,
  bomber: CONFIG.colors.bomber,
  baiter: CONFIG.colors.baiter,
  pod: CONFIG.colors.pod,
  swarmer: CONFIG.colors.swarmer,
  mine: CONFIG.colors.mine,
};

export class Radar {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.radar.height;
  }

  draw(state) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = CONFIG.radar.padding;
    const worldW = CONFIG.world.width;

    ctx.fillStyle = '#040804';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = CONFIG.colors.terrainLine;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.globalAlpha = 1;

    const toRadarX = (worldX) => pad + (worldX / worldW) * (w - pad * 2);
    const groundY = h - pad - 4;

    ctx.strokeStyle = CONFIG.colors.terrainLine;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(pad, groundY);
    ctx.lineTo(w - pad, groundY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (const hum of state.humanoids) {
      if (!hum.alive) continue;
      this.drawDot(ctx, toRadarX(hum.x), groundY - 2, 2, hum.state === 'grabbed' ? RADAR_COLORS.humanoidGrabbed : RADAR_COLORS.humanoid);
    }

    for (const e of state.enemies) {
      if (!e.alive) continue;
      const color = RADAR_COLORS[e.type] || '#fff';
      const y = pad + 6 + (e.y / CONFIG.world.groundY) * (groundY - pad - 10);
      const size = e.type === 'mutant' || e.type === 'baiter' ? 3 : 2;
      this.drawDot(ctx, toRadarX(e.x), y, size, color);
    }

    for (const m of state.mines) {
      if (!m.alive) continue;
      this.drawDot(ctx, toRadarX(m.x), pad + 8, 1.5, RADAR_COLORS.mine);
    }

    if (state.player.alive) {
      const py = pad + 4 + (state.player.y / CONFIG.world.groundY) * (groundY - pad - 8);
      ctx.fillStyle = RADAR_COLORS.player;
      ctx.shadowColor = RADAR_COLORS.player;
      ctx.shadowBlur = 4;
      ctx.fillRect(toRadarX(state.player.x) - 2, py - 1, 4, 2);
      ctx.shadowBlur = 0;
    }

    if (state.planetDestroyed) {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
    }
  }

  drawDot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
