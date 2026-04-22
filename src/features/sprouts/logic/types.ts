export type Player = 1 | 2;
export type GameMode = "hvh" | "hvai";
export type AiDifficulty = "easy" | "medium" | "hard";

export interface Point {
  id: string;
  x: number;
  y: number;
  degree: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  path: Vec2[];
  createdBy: Player;
  insertedPointId: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export interface GameState {
  points: Point[];
  edges: Edge[];
  currentPlayer: Player;
  mode: GameMode;
  aiDifficulty: AiDifficulty;
  statusText: string;
  selectedPointId: string | null;
  initialPoints: number;
  gameOver: boolean;
  winner: Player | null;
  turnNumber: number;
  moveHistory: MoveRecord[];
  snapshots: GameSnapshot[];
  pendingAi: boolean;
  hintMove: CandidateMove | null;
  lastError: string | null;
}

export interface MoveDraft {
  fromId: string;
  toId: string | null;
  pointer: Vec2 | null;
}

export interface CandidateMove {
  fromId: string;
  toId: string;
}

export interface MoveRecord {
  turnNumber: number;
  player: Player;
  sourceNodeId: string;
  targetNodeId: string;
  isLoop: boolean;
  spawnedNodeId: string;
}

export interface GameSnapshot {
  points: Point[];
  edges: Edge[];
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | null;
  turnNumber: number;
  statusText: string;
}
