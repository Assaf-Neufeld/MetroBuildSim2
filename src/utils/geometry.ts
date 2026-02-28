export interface Point {
  x: number;
  y: number;
}

export const distance = (a: Point, b: Point): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const linearlyInterpolate = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};
