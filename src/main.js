import { Game, createGameLoop } from './game.js';

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
