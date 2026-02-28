import { clamp } from '../utils/geometry';

export class Camera {
  x = 500;
  y = 350;
  zoom = 1;

  screenToWorld(screenX: number, screenY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: (screenX - cx) / this.zoom + this.x,
      y: (screenY - cy) / this.zoom + this.y,
    };
  }

  worldToScreen(worldX: number, worldY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: (worldX - this.x) * this.zoom + cx,
      y: (worldY - this.y) * this.zoom + cy,
    };
  }

  panByScreen(dx: number, dy: number): void {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
  }

  zoomAt(factor: number, screenX: number, screenY: number, canvas: HTMLCanvasElement): void {
    const before = this.screenToWorld(screenX, screenY, canvas);
    this.zoom = clamp(this.zoom * factor, 0.45, 2.5);
    const after = this.screenToWorld(screenX, screenY, canvas);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
  }
}
