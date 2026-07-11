import { CONFIG } from './config.js';
import { Game, createGameLoop } from './game.js';

function shouldShowMobileControls() {
  if (new URLSearchParams(window.location.search).has('mobileControls')) return true;
  if (CONFIG.debug.showMobileControls) return true;
  return window.matchMedia(
    `(max-width: ${CONFIG.mobile.breakpoint}px) and (pointer: coarse)`,
  ).matches;
}

function syncMobileControlsVisibility() {
  const show = shouldShowMobileControls();
  const debug = CONFIG.debug.showMobileControls
    || new URLSearchParams(window.location.search).has('mobileControls');
  const controls = document.getElementById('mobile-controls');

  document.documentElement.classList.toggle('show-mobile-controls', show);
  document.documentElement.classList.toggle('debug-mobile-controls', debug);
  document.body.classList.toggle('debug-mobile-controls', debug);
  if (controls) controls.hidden = !show;
}

syncMobileControlsVisibility();

const mobileControlsQuery = window.matchMedia(
  `(max-width: ${CONFIG.mobile.breakpoint}px) and (pointer: coarse)`,
);
mobileControlsQuery.addEventListener('change', syncMobileControlsVisibility);

const canvas = document.getElementById('game-canvas');
const radarCanvas = document.getElementById('radar-canvas');

const ui = {
  scoreEl: document.getElementById('score'),
  livesEl: document.getElementById('lives'),
  waveEl: document.getElementById('wave'),
  bombsEl: document.getElementById('bombs'),
  humanoidsEl: document.getElementById('humanoids'),
  highScoreEl: document.getElementById('high-score'),
  menuOverlay: document.getElementById('menu-overlay'),
  controlsOverlay: document.getElementById('controls-overlay'),
  pauseOverlay: document.getElementById('pause-overlay'),
  gameoverOverlay: document.getElementById('gameover-overlay'),
  finalScore: document.getElementById('final-score'),
};

const game = new Game(canvas, radarCanvas, ui);

function setInput(name, down) {
  game.input.setTouch(name, down);
}

function bindMobileControls() {
  const controls = document.getElementById('mobile-controls');
  if (!controls) return;

  const setPressed = (btn, pressed) => {
    btn.classList.toggle('is-pressed', pressed);
  };

  const onDown = (btn, input) => {
    setInput(input, true);
    setPressed(btn, true);
    game.audio.init();
  };

  const onUp = (btn, input) => {
    setInput(input, false);
    setPressed(btn, false);
  };

  for (const btn of controls.querySelectorAll('[data-input]')) {
    const input = btn.dataset.input;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      onDown(btn, input);
    });
    const release = () => onUp(btn, input);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', (e) => {
      if (!btn.hasPointerCapture(e.pointerId)) release();
    });
  }
}

bindMobileControls();

document.getElementById('play-btn').addEventListener('click', () => {
  game.audio.init();
  game.start();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  game.start();
});

document.getElementById('controls-btn').addEventListener('click', () => {
  ui.menuOverlay.classList.add('hidden');
  ui.controlsOverlay.classList.remove('hidden');
});

document.getElementById('controls-back-btn').addEventListener('click', () => {
  ui.controlsOverlay.classList.add('hidden');
  ui.menuOverlay.classList.remove('hidden');
});

document.getElementById('resume-btn').addEventListener('click', () => {
  game.resume();
});

document.getElementById('music-toggle').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  const on = btn.textContent.includes('On');
  game.audio.setEnabled(!on);
  btn.textContent = on ? 'Audio: Off' : 'Audio: On';
});

ui.highScoreEl.textContent = game.highScore;

createGameLoop(game);
