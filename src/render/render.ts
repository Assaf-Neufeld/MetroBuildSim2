import type { StationShape } from '../types';
import type { Game } from '../engine/game';
import type { Camera } from '../engine/camera';

const drawStationShape = (
  ctx: CanvasRenderingContext2D,
  shape: StationShape,
  x: number,
  y: number,
  radius: number
): void => {
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (shape === 'square') {
    ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(x, y - radius - 2);
  ctx.lineTo(x - radius - 1, y + radius);
  ctx.lineTo(x + radius + 1, y + radius);
  ctx.closePath();
  ctx.stroke();
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  camera: Camera,
  game: Game
): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const line of game.lines) {
    if (line.stations.length < 2) continue;
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 8;
    ctx.beginPath();

    line.stations.forEach((stationId, index) => {
      const station = game.stationById(stationId);
      if (!station) return;
      if (index === 0) ctx.moveTo(station.x, station.y);
      else ctx.lineTo(station.x, station.y);
    });

    ctx.stroke();
  }

  for (const train of game.trains) {
    const line = game.lines.find((candidate) => candidate.id === train.lineId);
    if (!line || line.stations.length < 2) continue;

    const fromIndex = train.direction === 1 ? train.segmentIndex : train.segmentIndex + 1;
    const toIndex = train.direction === 1 ? train.segmentIndex + 1 : train.segmentIndex;
    const from = game.stationById(line.stations[fromIndex]);
    const to = game.stationById(line.stations[toIndex]);
    if (!from || !to) continue;

    const x = from.x + (to.x - from.x) * train.t;
    const y = from.y + (to.y - from.y) * train.t;

    ctx.fillStyle = line.color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const station of game.level.stations) {
    const waiting = game.stationState[station.id].waiting.length;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = waiting > station.capacity ? '#ef4444' : '#e2e8f0';
    ctx.lineWidth = 3;
    drawStationShape(ctx, station.shape, station.x, station.y, 14);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${station.id} (${waiting})`, station.x - 22, station.y - 22);
  }

  ctx.restore();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Wheel/Pinch: Zoom · Drag: Pan · Tap/Click station: Build line', 12, canvas.height - 12);
};
