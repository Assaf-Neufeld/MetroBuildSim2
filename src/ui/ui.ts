import type { Game } from '../engine/game';
import type { GameStats } from '../types';

export interface UIBindings {
  updateStats: (stats: GameStats) => void;
  showToast: (text: string, kind: 'info' | 'error' | 'success') => void;
}

export const bindUI = (game: Game): UIBindings => {
  const overlay = document.getElementById('ui-overlay');
  const toastContainer = document.getElementById('toast-container');
  if (!overlay || !toastContainer) {
    throw new Error('UI containers are missing from index.html.');
  }

  overlay.innerHTML = `
    <div class="panel top-left">
      <div class="row">
        <button id="prev-level">Prev Level</button>
        <button id="next-level">Next Level</button>
        <span id="level-label"></span>
      </div>
      <div class="row">
        <button id="mode-build">Build</button>
        <button id="mode-sim">Simulate</button>
      </div>
      <div class="row">
        <button id="new-line">New Line</button>
        <button id="finish-line">Finish Line</button>
        <button id="undo">Undo</button>
        <button id="delete-line">Delete Line</button>
      </div>
      <div class="row">
        <button id="start">Start</button>
        <button id="pause">Pause/Resume</button>
        <button id="reset">Reset</button>
      </div>
    </div>

    <div class="panel top-right" id="stats-panel">
      <div><strong>Delivered:</strong> <span id="stat-delivered">0</span></div>
      <div><strong>Avg Wait:</strong> <span id="stat-wait">0.0s</span></div>
      <div><strong>Crowded:</strong> <span id="stat-crowded">-</span></div>
      <div><strong>Timer:</strong> <span id="stat-timer">0s</span></div>
      <div><strong>Lines:</strong> <span id="stat-lines">0</span></div>
      <div><strong>Segments:</strong> <span id="stat-segments">0</span></div>
      <div><strong>Status:</strong> <span id="stat-status">stopped</span></div>
      <div class="small" id="level-desc"></div>
      <div class="small" id="goal-desc"></div>
    </div>
  `;

  const byId = (id: string): HTMLElement => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element #${id}`);
    return element;
  };

  byId('mode-build').addEventListener('click', () => game.setMode('build'));
  byId('mode-sim').addEventListener('click', () => game.setMode('simulate'));

  byId('new-line').addEventListener('click', () => game.createNewLine());
  byId('finish-line').addEventListener('click', () => game.finishCurrentLine());
  byId('undo').addEventListener('click', () => game.undoCurrentLine());
  byId('delete-line').addEventListener('click', () => game.deleteLine());

  byId('start').addEventListener('click', () => game.startSimulation());
  byId('pause').addEventListener('click', () => game.pauseSimulation());
  byId('reset').addEventListener('click', () => game.resetSimulation());

  byId('prev-level').addEventListener('click', () => game.previousLevel());
  byId('next-level').addEventListener('click', () => game.nextLevel());

  const updateStats = (stats: GameStats): void => {
    byId('level-label').textContent = `${stats.levelName} (${stats.levelIndex + 1}/${stats.levelCount})`;
    byId('stat-delivered').textContent = String(stats.delivered);
    byId('stat-wait').textContent = `${stats.avgWait.toFixed(1)}s`;
    byId('stat-crowded').textContent = stats.mostCrowdedStationId || '-';
    byId('stat-timer').textContent = `${Math.floor(stats.elapsed)}s`;
    byId('stat-lines').textContent = `${stats.linesUsed}/${stats.maxLines}`;
    byId('stat-segments').textContent = `${stats.segmentsUsed}/${stats.maxSegments}`;
    byId('stat-status').textContent = `${stats.mode} · ${stats.runState}`;

    const level = game.level;
    byId('level-desc').textContent = level.description;
    byId('goal-desc').textContent = `Goal: survive ${level.goals.surviveSeconds}s, deliver ${level.goals.deliveredTarget}, avg wait ≤ ${level.goals.maxAvgWait}s`;
  };

  const showToast = (text: string, kind: 'info' | 'error' | 'success'): void => {
    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.textContent = text;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade');
      setTimeout(() => toast.remove(), 280);
    }, 2000);
  };

  return { updateStats, showToast };
};
