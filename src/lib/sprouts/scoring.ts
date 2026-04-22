import { generateLegalMoves } from "./legalMoveGeneration";
import type { CandidateMove, Edge, Player, Point } from "@/features/sprouts/logic/types";
import { buildCandidatePath } from "@/features/sprouts/logic/rules";
import { findMidPointOnPath } from "@/features/sprouts/logic/geometry";

function applyMoveLocally(points: Point[], edges: Edge[], move: CandidateMove): { points: Point[]; edges: Edge[] } | null {
  const path = buildCandidatePath({ points, edges, fromId: move.fromId, toId: move.toId });
  if (!path) return null;

  const inserted = findMidPointOnPath(path);
  const spawnedId = `sim-${points.length + 1}`;

  const nextPoints = points.map((point) => {
    if (point.id === move.fromId || point.id === move.toId) {
      return { ...point, degree: point.degree + 1 };
    }
    return { ...point };
  });
  nextPoints.push({ id: spawnedId, x: inserted.x, y: inserted.y, degree: 2 });

  const nextEdges = [
    ...edges,
    {
      id: `sim-e-${edges.length + 1}`,
      from: move.fromId,
      to: move.toId,
      path,
      createdBy: 1 as Player,
      insertedPointId: spawnedId,
    },
  ];

  return { points: nextPoints, edges: nextEdges };
}

export function scoreMoveByFutureOptions(points: Point[], edges: Edge[], move: CandidateMove): number {
  const after = applyMoveLocally(points, edges, move);
  if (!after) return -9999;
  return generateLegalMoves(after.points, after.edges, 180).length;
}

export function scoreMoveHard(points: Point[], edges: Edge[], move: CandidateMove): number {
  const after = applyMoveLocally(points, edges, move);
  if (!after) return -9999;

  const myOptions = generateLegalMoves(after.points, after.edges, 180).length;
  const degreeBudget = after.points.reduce((sum, point) => sum + (3 - point.degree), 0);
  const loopBonus = move.fromId === move.toId ? 0.4 : 0;

  return myOptions * 1.25 + degreeBudget * 0.06 + loopBonus;
}
