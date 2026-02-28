import type { Game } from '../engine/game';
import type { Camera } from '../engine/camera';

interface PointerData {
  x: number;
  y: number;
}

export class BuildController {
  private activePointers = new Map<number, PointerData>();
  private pinchDistance: number | null = null;
  private isDragging = false;
  private movedSinceDown = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private game: Game,
    private camera: Camera
  ) {
    this.bind();
  }

  private bind(): void {
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    this.canvas.addEventListener('pointerdown', (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.isDragging = false;
      this.movedSinceDown = false;
    });

    this.canvas.addEventListener('pointermove', (event) => {
      const previous = this.activePointers.get(event.pointerId);
      if (!previous) return;

      const current: PointerData = { x: event.clientX, y: event.clientY };
      this.activePointers.set(event.pointerId, current);

      if (this.activePointers.size === 2) {
        const [a, b] = [...this.activePointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinchDistance !== null && Math.abs(distance - this.pinchDistance) > 1) {
          const centerX = (a.x + b.x) / 2;
          const centerY = (a.y + b.y) / 2;
          const factor = distance / this.pinchDistance;
          this.camera.zoomAt(factor, centerX, centerY, this.canvas);
          this.isDragging = true;
        }
        this.pinchDistance = distance;
        this.movedSinceDown = true;
        return;
      }

      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      if (Math.hypot(dx, dy) > 1) {
        this.camera.panByScreen(dx, dy);
        this.isDragging = true;
        this.movedSinceDown = true;
      }
    });

    this.canvas.addEventListener('pointerup', (event) => {
      const wasTap = !this.movedSinceDown && this.activePointers.size <= 1;
      this.activePointers.delete(event.pointerId);
      this.pinchDistance = this.activePointers.size < 2 ? null : this.pinchDistance;

      if (!wasTap) return;

      const rect = this.canvas.getBoundingClientRect();
      const world = this.camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top, this.canvas);
      const station = this.game.findStationNear(world.x, world.y, 24 / this.camera.zoom);
      if (!station) return;

      const forceNewLine = event.shiftKey;
      this.game.addStationToCurrentLine(station.id, forceNewLine);
    });

    this.canvas.addEventListener('pointercancel', (event) => {
      this.activePointers.delete(event.pointerId);
      if (this.activePointers.size < 2) this.pinchDistance = null;
    });

    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const factor = event.deltaY < 0 ? 1.1 : 0.92;
        this.camera.zoomAt(factor, x, y, this.canvas);
      },
      { passive: false }
    );

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.game.cancelCurrentLine();
      }
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (event.button === 2) {
        this.game.cancelCurrentLine();
      }
    });
  }
}
