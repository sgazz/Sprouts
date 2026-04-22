import { AI_HARD_SAMPLE } from "@/features/sprouts/config/constants";
import type { AiDifficulty, CandidateMove, Edge, Point } from "@/features/sprouts/logic/types";
import { generateLegalMoves } from "./legalMoveGeneration";
import { scoreMoveByFutureOptions, scoreMoveHard } from "./scoring";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function topByScore(
  moves: CandidateMove[],
  scoreFn: (move: CandidateMove) => number,
  take = 1,
): CandidateMove[] {
  return [...moves]
    .map((move) => ({ move, score: scoreFn(move) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((entry) => entry.move);
}

export function chooseAiMove(points: Point[], edges: Edge[], difficulty: AiDifficulty): CandidateMove | null {
  const legalMoves = generateLegalMoves(points, edges);
  if (legalMoves.length === 0) return null;

  if (difficulty === "easy") {
    return pickRandom(legalMoves);
  }

  if (difficulty === "medium") {
    const bestPool = topByScore(
      legalMoves,
      (move) => scoreMoveByFutureOptions(points, edges, move),
      Math.min(3, legalMoves.length),
    );
    return pickRandom(bestPool);
  }

  const sampled = legalMoves.length > AI_HARD_SAMPLE ? legalMoves.slice(0, AI_HARD_SAMPLE) : legalMoves;
  const bestPool = topByScore(
    sampled,
    (move) => scoreMoveHard(points, edges, move),
    Math.min(2, sampled.length),
  );
  return pickRandom(bestPool);
}
