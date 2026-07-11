import { CONFIG } from './config.js';

export class Input {
  constructor() {    this.keys = {};
    this.justPressed = {};
    this.touch = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
    };
    this.touchJustPressed = {};
    this.mobileAutoFire = false;
    this.enabled = true;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  setTouch(name, down) {
    if (!this.enabled) return;

    if (name in this.touch) {
      if (down && !this.touch[name]) {
        this.touchJustPressed[name] = true;
      }
      this.touch[name] = down;
      return;
    }

    const tapActions = ['reverse', 'smartBomb', 'hyperspace', 'pause'];
    if (tapActions.includes(name) && down) {
      this.touchJustPressed[name] = true;
    }
  }

  onKeyDown(e) {
    if (!this.enabled) return;
    const code = e.code;
    if (!this.keys[code]) {
      this.justPressed[code] = true;
    }
    this.keys[code] = true;

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    const code = e.code;
    this.keys[code] = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  wasTouchPressed(name) {
    return !!this.touchJustPressed[name];
  }

  clearJustPressed() {
    this.justPressed = {};
    this.touchJustPressed = {};
  }

  getMovement() {
    let dx = 0;
    let dy = 0;
    if (this.isDown('ArrowLeft') || this.isDown('KeyA') || this.touch.left) dx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD') || this.touch.right) dx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW') || this.touch.up) dy -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS') || this.touch.down) dy += 1;
    return { dx, dy };
  }

  isMobileViewport() {
    return window.matchMedia(
      `(max-width: ${CONFIG.mobile.breakpoint}px) and (pointer: coarse)`,
    ).matches;
  }

  fire() {
    if (CONFIG.mobile.autoFire && this.mobileAutoFire && this.isMobileViewport()) {
      return true;
    }
    return this.isDown('Space') || this.touch.fire;
  }

  reverse() {
    return this.wasPressed('KeyZ') || this.wasTouchPressed('reverse');
  }

  smartBomb() {
    return this.wasPressed('KeyX') || this.wasTouchPressed('smartBomb');
  }

  hyperspace() {
    return this.wasPressed('KeyC') || this.wasTouchPressed('hyperspace');
  }

  pause() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape') || this.wasTouchPressed('pause');
  }
}
