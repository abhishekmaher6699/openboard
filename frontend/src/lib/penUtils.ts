// Ramer-Douglas-Peucker point simplification
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  }
  const t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(point[0] - (lineStart[0] + t * dx), point[1] - (lineStart[1] + t * dy));
}

function rdp(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = rdp(points.slice(0, maxIdx + 1), tolerance);
    const right = rdp(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

// flatten [x,y][] to number[] relative to origin
export function flattenPoints(
  points: [number, number][],
  originX: number,
  originY: number,
): number[] {
  return points.flatMap(([x, y]) => [x - originX, y - originY]);
}

// unflatten number[] to [x,y][] absolute
export function unflattenPoints(
  flat: number[],
  originX: number,
  originY: number,
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < flat.length; i += 2) {
    result.push([flat[i] + originX, flat[i + 1] + originY]);
  }
  return result;
}

export function simplifyPoints(
  points: [number, number][],
  tolerance = 2,
): [number, number][] {
  return rdp(points, tolerance);
}

// bounding box of absolute points
export function getBounds(points: [number, number][]): {
  x: number; y: number; width: number; height: number;
} {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}