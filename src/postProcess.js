import { CONFIG } from './config.js';

export class PostProcessor {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.sceneCanvas = document.createElement('canvas');
    this.sceneCanvas.width = width;
    this.sceneCanvas.height = height;
    this.sceneCtx = this.sceneCanvas.getContext('2d');

    const scale = CONFIG.postProcess.scale;
    this.glowCanvas = document.createElement('canvas');
    this.glowCanvas.width = Math.max(1, Math.floor(width * scale));
    this.glowCanvas.height = Math.max(1, Math.floor(height * scale));
    this.glowCtx = this.glowCanvas.getContext('2d');
  }

  getSceneContext() {
    return this.sceneCtx;
  }

  apply(displayCtx) {
    const cfg = CONFIG.postProcess;
    const { sceneCanvas, glowCanvas, glowCtx, width, height } = this;

    if (!cfg.enabled) {
      displayCtx.drawImage(sceneCanvas, 0, 0);
      return;
    }

    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    glowCtx.filter = `blur(${cfg.blur * cfg.scale}px)`;
    glowCtx.drawImage(sceneCanvas, 0, 0, glowCanvas.width, glowCanvas.height);
    glowCtx.filter = 'none';

    displayCtx.clearRect(0, 0, width, height);
    displayCtx.drawImage(sceneCanvas, 0, 0);

    displayCtx.save();
    displayCtx.globalCompositeOperation = cfg.blendMode;
    displayCtx.globalAlpha = cfg.strength;
    displayCtx.drawImage(glowCanvas, 0, 0, width, height);
    displayCtx.restore();
  }
}
