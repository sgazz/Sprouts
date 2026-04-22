import { AI_MAX_LEGAL_MOVES_SCAN } from "@/features/sprouts/config/constants";
import { validateMove } from "@/features/sprouts/logic/rules";
import type { CandidateMove, Edge, Point } from "@/features/sprouts/logic/types";

export function generateLegalMoves(
  points: Point[],
  edges: Edge[],
  limit = AI_MAX_LEGAL_MOVES_SCAN,
): CandidateMove[] {
  const moves: CandidateMove[] = [];
  const playable = points.filter((point) => point.degree < 3);

  for (let i = 0; i < playable.length; i += 1) {
    for (let j = i; j < playable.length; j += 1) {
      const move = { fromId: playable[i].id, toId: playable[j].id };
      const legal = validateMove({ points, edges, fromId: move.fromId, toId: move.toId });
      if (legal.ok) {
        moves.push(move);
        if (moves.length >= limit) return moves;
      }
    }
  }

  return moves;
}
