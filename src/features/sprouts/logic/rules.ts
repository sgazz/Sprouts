import { ENDPOINT_TOLERANCE, NODE_PATH_COLLISION_RADIUS } from "../config/constants";
import {
  distance,
  pointNearPath,
  pointsEqual,
  sampleLinePath,
  sampleLoopPath,
  segmentsIntersect,
} from "./geometry";
import type { Edge, Point, ValidationResult, Vec2 } from "./types";

interface MoveCheckInput {
  points: Point[];
  edges: Edge[];
  fromId: string;
  toId: string;
}

interface BuildPathInput {
  points: Point[];
  edges?: Edge[];
  fromId: string;
  toId: string;
}

function indexById(points: Point[]): Map<string, Point> {
  return new Map(points.map((p) => [p.id, p]));
}

export function buildCandidatePath(input: BuildPathInput): Vec2[] | null {
  const map = indexById(input.points);
  const from = map.get(input.fromId);
  const to = map.get(input.toId);

  if (!from || !to) return null;
  if (from.id === to.id) return sampleLoopPath(from);
  const existingBetween = (input.edges ?? []).filter(
    (edge) =>
      (edge.from === from.id && edge.to === to.id) ||
      (edge.from === to.id && edge.to === from.id),
  ).length;
  const directionSeed = existingBetween % 2 === 0 ? 1 : -1;
  const curvatureScale = 1 + Math.min(existingBetween, 2) * 0.25;
  return sampleLinePath(from, to, directionSeed, curvatureScale);
}

function getEdgeSegments(path: Vec2[]): Array<[Vec2, Vec2]> {
  const segments: Array<[Vec2, Vec2]> = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    segments.push([path[i], path[i + 1]]);
  }
  return segments;
}

function segmentsShareEndpoint(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  return pointsEqual(a1, b1) || pointsEqual(a1, b2) || pointsEqual(a2, b1) || pointsEqual(a2, b2);
}

function isEndpointArea(point: Vec2, endpoints: Vec2[]): boolean {
  return endpoints.some((endpoint) => distance(point, endpoint) <= ENDPOINT_TOLERANCE);
}

function violatesCrossing(newPath: Vec2[], edges: Edge[]): boolean {
  const newSegments = getEdgeSegments(newPath);
  const endpoints = [newPath[0], newPath[newPath.length - 1]];

  for (const edge of edges) {
    const oldSegments = getEdgeSegments(edge.path);
    for (const [na, nb] of newSegments) {
      for (const [oa, ob] of oldSegments) {
        if (segmentsShareEndpoint(na, nb, oa, ob)) continue;
        if (isEndpointArea(na, endpoints) || isEndpointArea(nb, endpoints)) continue;
        if (segmentsIntersect(na, nb, oa, ob)) return true;
      }
    }
  }
  return false;
}

function violatesPointThrough(newPath: Vec2[], points: Point[], fromId: string, toId: string): boolean {
  for (const point of points) {
    if (point.id === fromId || point.id === toId) continue;
    if (pointNearPath(point, newPath, NODE_PATH_COLLISION_RADIUS)) return true;
  }
  return false;
}

export function validateMove(input: MoveCheckInput): ValidationResult {
  const map = indexById(input.points);
  const from = map.get(input.fromId);
  const to = map.get(input.toId);

  if (!from || !to) return { ok: false, reason: "Nevažeća tačka." };
  if (from.degree >= 3 || to.degree >= 3) return { ok: false, reason: "Tačka je dostigla stepen 3." };

  const path = buildCandidatePath({
    points: input.points,
    edges: input.edges,
    fromId: input.fromId,
    toId: input.toId,
  });
  if (!path) return { ok: false, reason: "Nije moguće formirati putanju." };

  if (violatesCrossing(path, input.edges)) {
    return { ok: false, reason: "Linija seče postojeću liniju." };
  }

  if (violatesPointThrough(path, input.points, input.fromId, input.toId)) {
    return { ok: false, reason: "Linija prolazi kroz drugu tačku." };
  }

  return { ok: true };
}
