import './style.css';
import { Game } from './engine/game';
import { Camera } from './engine/camera';
import { renderGame } from './render/render';
import { BuildController } from './build/buildController';
import { bindUI } from './ui/ui';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Canvas #game-canvas not found.');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('2D context is not available.');
}

const resizeCanvas = (): void => {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const game = new Game();
const camera = new Camera();
new BuildController(canvas, game, camera);

const ui = bindUI(game);

game.setCallbacks({
  onToast: (message) => ui.showToast(message.text, message.type),
  onStats: (stats) => ui.updateStats(stats),
  onFrame: () => renderGame(ctx, canvas, camera, game),
});

game.startLoop();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // silent fallback
    });
  });
}
