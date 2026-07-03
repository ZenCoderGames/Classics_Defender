export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.enabled = true;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
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

  clearJustPressed() {
    this.justPressed = {};
  }

  getMovement() {
    let dx = 0;
    let dy = 0;
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) dx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) dx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) dy -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) dy += 1;
    return { dx, dy };
  }

  fire() {
    return this.isDown('Space');
  }

  reverse() {
    return this.wasPressed('KeyZ');
  }

  smartBomb() {
    return this.wasPressed('KeyX');
  }

  hyperspace() {
    return this.wasPressed('KeyC');
  }

  pause() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape');
  }
}
