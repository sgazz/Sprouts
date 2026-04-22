import { CURVE_OFFSET, INTERSECTION_EPSILON, LOOP_OFFSET, PATH_SAMPLES, POINT_RADIUS } from "../config/constants";
import type { Vec2 } from "./types";

const EPSILON = INTERSECTION_EPSILON;

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function cross(a: Vec2, b: Vec2, c: Vec2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function isBetween(a: number, b: number, x: number): boolean {
  return x >= Math.min(a, b) - EPSILON && x <= Math.max(a, b) + EPSILON;
}

function isPointOnSegmentRaw(p: Vec2, a: Vec2, b: Vec2): boolean {
  if (Math.abs(cross(a, b, p)) > EPSILON) return false;
  return isBetween(a.x, b.x, p.x) && isBetween(a.y, b.y, p.y);
}

export function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    return distance(p, a);
  }

  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const projection = { x: a.x + clamped * dx, y: a.y + clamped * dy };
  return distance(p, projection);
}

function orientationsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  const o1 = cross(a1, a2, b1);
  const o2 = cross(a1, a2, b2);
  const o3 = cross(b1, b2, a1);
  const o4 = cross(b1, b2, a2);

  if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) && (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) {
    return true;
  }

  if (Math.abs(o1) < EPSILON && isPointOnSegmentRaw(b1, a1, a2)) return true;
  if (Math.abs(o2) < EPSILON && isPointOnSegmentRaw(b2, a1, a2)) return true;
  if (Math.abs(o3) < EPSILON && isPointOnSegmentRaw(a1, b1, b2)) return true;
  if (Math.abs(o4) < EPSILON && isPointOnSegmentRaw(a2, b1, b2)) return true;

  return false;
}

export function pointsEqual(a: Vec2, b: Vec2): boolean {
  return distance(a, b) < EPSILON * 10;
}

export function segmentsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  return orientationsIntersect(a1, a2, b1, b2);
}

export function sampleLinePath(from: Vec2, to: Vec2, curvatureDirection = 1, curvatureScale = 1): Vec2[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return [from, to];

  const nx = -dy / length;
  const ny = dx / length;
  const bend = Math.min(CURVE_OFFSET * curvatureScale, length * 0.3) * curvatureDirection;
  const control = {
    x: (from.x + to.x) * 0.5 + nx * bend,
    y: (from.y + to.y) * 0.5 + ny * bend,
  };

  const result: Vec2[] = [];
  for (let i = 0; i <= PATH_SAMPLES; i += 1) {
    const t = i / PATH_SAMPLES;
    const oneMinusT = 1 - t;
    result.push({
      x: oneMinusT * oneMinusT * from.x + 2 * oneMinusT * t * control.x + t * t * to.x,
      y: oneMinusT * oneMinusT * from.y + 2 * oneMinusT * t * control.y + t * t * to.y,
    });
  }
  return result;
}

export function sampleLoopPath(center: Vec2): Vec2[] {
  const result: Vec2[] = [];
  const radius = LOOP_OFFSET;
  const startAngle = -Math.PI * 0.2;
  const endAngle = Math.PI * 1.8;

  for (let i = 0; i <= PATH_SAMPLES; i += 1) {
    const t = i / PATH_SAMPLES;
    const angle = startAngle + (endAngle - startAngle) * t;
    result.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  result[0] = { ...center };
  result[result.length - 1] = { ...center };
  return result;
}

export function findMidPointOnPath(path: Vec2[]): Vec2 {
  const total = pathLength(path);
  let remaining = total / 2;

  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i];
    const b = path[i + 1];
    const seg = distance(a, b);
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= seg;
  }

  return path[Math.floor(path.length / 2)];
}

export function pathLength(path: Vec2[]): number {
  let length = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    length += distance(path[i], path[i + 1]);
  }
  return length;
}

export function pointNearPath(point: Vec2, path: Vec2[], tolerance = POINT_RADIUS): boolean {
  for (let i = 0; i < path.length - 1; i += 1) {
    const d = pointToSegmentDistance(point, path[i], path[i + 1]);
    if (d <= tolerance) return true;
  }
  return false;
}
