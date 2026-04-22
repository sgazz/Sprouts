import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config/constants";
import { findMidPointOnPath } from "./geometry";
import { hasAnyLegalMove } from "./legalMoveSearch";
import { buildCandidatePath, validateMove } from "./rules";
import type { AiDifficulty, Edge, GameMode, GameSnapshot, GameState, MoveRecord, Player, Point } from "./types";

function nextPlayer(current: Player): Player {
  return current === 1 ? 2 : 1;
}

function createInitialPoints(initialPoints: number): Point[] {
  const points: Point[] = [];
  const centerY = CANVAS_HEIGHT / 2;
  const spacing = CANVAS_WIDTH / (initialPoints + 1);

  for (let i = 0; i < initialPoints; i += 1) {
    points.push({
      id: `p-${i + 1}`,
      x: spacing * (i + 1),
      y: centerY,
      degree: 0,
    });
  }
  return points;
}

function buildSnapshot(state: GameState): GameSnapshot {
  return {
    points: state.points.map((point) => ({ ...point })),
    edges: state.edges.map((edge) => ({ ...edge, path: edge.path.map((p) => ({ ...p })) })),
    currentPlayer: state.currentPlayer,
    gameOver: state.gameOver,
    winner: state.winner,
    turnNumber: state.turnNumber,
    statusText: state.statusText,
  };
}

export function createInitialState(initialPoints = 3, mode: GameMode = "hvh", aiDifficulty: AiDifficulty = "easy"): GameState {
  const points = createInitialPoints(initialPoints);
  return {
    points,
    edges: [],
    currentPlayer: 1,
    mode,
    aiDifficulty,
    statusText: "Izaberi početnu tačku.",
    selectedPointId: null,
    initialPoints,
    gameOver: false,
    winner: null,
    turnNumber: 1,
    moveHistory: [],
    snapshots: [],
    pendingAi: false,
    hintMove: null,
    lastError: null,
  };
}

function clonePoints(points: Point[]): Point[] {
  return points.map((point) => ({ ...point }));
}

function withDegree(points: Point[], id: string): Point[] {
  return points.map((point) => (point.id === id ? { ...point, degree: point.degree + 1 } : point));
}

function appendEdge(
  points: Point[],
  edges: Edge[],
  fromId: string,
  toId: string,
  currentPlayer: Player,
): { points: Point[]; edges: Edge[]; moveRecord: MoveRecord } {
  const path = buildCandidatePath({ points, edges, fromId, toId });
  if (!path) {
    return {
      points,
      edges,
      moveRecord: {
        turnNumber: 0,
        player: currentPlayer,
        sourceNodeId: fromId,
        targetNodeId: toId,
        isLoop: fromId === toId,
        spawnedNodeId: "",
      },
    };
  }

  const inserted = findMidPointOnPath(path);
  const insertedPointId = `p-${points.length + 1}`;
  const insertedPoint: Point = {
    id: insertedPointId,
    x: inserted.x,
    y: inserted.y,
    degree: 2,
  };

  let nextPoints = clonePoints(points);
  nextPoints = withDegree(nextPoints, fromId);
  nextPoints = withDegree(nextPoints, toId);
  nextPoints.push(insertedPoint);

  const edge: Edge = {
    id: `e-${edges.length + 1}`,
    from: fromId,
    to: toId,
    path,
    createdBy: currentPlayer,
    insertedPointId,
  };

  return {
    points: nextPoints,
    edges: [...edges, edge],
    moveRecord: {
      turnNumber: 0,
      player: currentPlayer,
      sourceNodeId: fromId,
      targetNodeId: toId,
      isLoop: fromId === toId,
      spawnedNodeId: insertedPointId,
    },
  };
}

export function applyMove(state: GameState, fromId: string, toId: string): GameState {
  if (state.gameOver) return state;

  const validation = validateMove({ points: state.points, edges: state.edges, fromId, toId });
  if (!validation.ok) {
    return {
      ...state,
      statusText: validation.reason ?? "Nelegalan potez.",
      selectedPointId: null,
      lastError: validation.reason ?? "Nelegalan potez.",
    };
  }

  const snapshot = buildSnapshot(state);
  const after = appendEdge(state.points, state.edges, fromId, toId, state.currentPlayer);
  const upcomingPlayer = nextPlayer(state.currentPlayer);
  const canContinue = hasAnyLegalMove(after.points, after.edges);
  const moveRecord: MoveRecord = { ...after.moveRecord, turnNumber: state.turnNumber };

  if (!canContinue) {
    return {
      ...state,
      points: after.points,
      edges: after.edges,
      selectedPointId: null,
      gameOver: true,
      winner: state.currentPlayer,
      turnNumber: state.turnNumber + 1,
      snapshots: [...state.snapshots, snapshot],
      moveHistory: [...state.moveHistory, moveRecord],
      hintMove: null,
      pendingAi: false,
      lastError: null,
      statusText: `Igra je gotova. Pobeđuje igrač ${state.currentPlayer}.`,
    };
  }

  return {
    ...state,
    points: after.points,
    edges: after.edges,
    currentPlayer: upcomingPlayer,
    selectedPointId: null,
    gameOver: false,
    winner: null,
    turnNumber: state.turnNumber + 1,
    snapshots: [...state.snapshots, snapshot],
    moveHistory: [...state.moveHistory, moveRecord],
    pendingAi: state.mode === "hvai" && upcomingPlayer === 2,
    hintMove: null,
    lastError: null,
    statusText: `Na potezu je igrač ${upcomingPlayer}.`,
  };
}

export function selectStartPoint(state: GameState, pointId: string): GameState {
  const point = state.points.find((item) => item.id === pointId);
  if (!point) return state;
  if (point.degree >= 3) {
    return {
      ...state,
      selectedPointId: null,
      statusText: "Izabrana tačka nema slobodan stepen.",
      lastError: "Izabrana tačka nema slobodan stepen.",
    };
  }

  return {
    ...state,
    selectedPointId: pointId,
    statusText: "Izaberi ciljnu tačku ili istu tačku za loop.",
    hintMove: null,
    lastError: null,
  };
}

export function resetGame(initialPoints: number, mode: GameMode, aiDifficulty: AiDifficulty): GameState {
  return createInitialState(initialPoints, mode, aiDifficulty);
}

export function undoMove(state: GameState): GameState {
  if (state.snapshots.length === 0) return state;

  const shouldUndoTwo = state.mode === "hvai" && state.moveHistory.length >= 2;
  const steps = shouldUndoTwo ? 2 : 1;
  const targetIndex = Math.max(0, state.snapshots.length - steps);
  const snapshot = state.snapshots[targetIndex];
  const nextSnapshots = state.snapshots.slice(0, targetIndex);
  const nextHistory = state.moveHistory.slice(0, Math.max(0, state.moveHistory.length - steps));

  return {
    ...state,
    points: snapshot.points,
    edges: snapshot.edges,
    currentPlayer: snapshot.currentPlayer,
    gameOver: snapshot.gameOver,
    winner: snapshot.winner,
    turnNumber: snapshot.turnNumber,
    statusText: "Potez vraćen.",
    selectedPointId: null,
    snapshots: nextSnapshots,
    moveHistory: nextHistory,
    pendingAi: false,
    hintMove: null,
    lastError: null,
  };
}

export function setHintMove(state: GameState, fromId: string, toId: string): GameState {
  return {
    ...state,
    hintMove: { fromId, toId },
    statusText: `Predlog: ${fromId} -> ${toId}`,
  };
}

export function clearHint(state: GameState): GameState {
  return { ...state, hintMove: null };
}

export function setMode(state: GameState, mode: GameMode): GameState {
  return { ...state, mode };
}

export function setDifficulty(state: GameState, aiDifficulty: AiDifficulty): GameState {
  return { ...state, aiDifficulty };
}

export function setAiPending(state: GameState, pendingAi: boolean, statusText?: string): GameState {
  return {
    ...state,
    pendingAi,
    statusText: statusText ?? state.statusText,
  };
}
