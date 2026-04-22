import { generateLegalMoves } from "@/lib/sprouts/legalMoveGeneration";
import type { Edge, Point } from "./types";

export function hasAnyLegalMove(points: Point[], edges: Edge[]): boolean {
  return generateLegalMoves(points, edges, 1).length > 0;
}
