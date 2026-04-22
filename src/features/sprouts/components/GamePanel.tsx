"use client";

import type { Player } from "../logic/types";
import type { AiDifficulty, GameMode, MoveRecord } from "../logic/types";

interface GamePanelProps {
  currentPlayer: Player;
  statusText: string;
  initialPoints: number;
  gameOver: boolean;
  mode: GameMode;
  aiDifficulty: AiDifficulty;
  moveHistory: MoveRecord[];
  pendingAi: boolean;
  onRestart: () => void;
  onUndo: () => void;
  onHint: () => void;
  onInitialPointsChange: (count: number) => void;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: AiDifficulty) => void;
}

export function GamePanel({
  currentPlayer,
  statusText,
  initialPoints,
  gameOver,
  mode,
  aiDifficulty,
  moveHistory,
  pendingAi,
  onRestart,
  onUndo,
  onHint,
  onInitialPointsChange,
  onModeChange,
  onDifficultyChange,
}: GamePanelProps) {
  return (
    <aside className="gamePanel">
      <h2>Klica (Sprouts)</h2>
      <p className="meta">{mode === "hvh" ? "Lokalna igra za 2 igrača" : "Igrač protiv AI"}</p>
      <div className="panelRow">
        <span>Na potezu:</span>
        <strong>Igrač {currentPlayer}</strong>
      </div>
      {pendingAi ? <p className="aiThinking">AI razmišlja...</p> : null}
      <p className={`status ${gameOver ? "over" : ""}`}>{statusText}</p>
      <label className="controlGroup">
        Mod igre
        <select value={mode} onChange={(event) => onModeChange(event.target.value as GameMode)}>
          <option value="hvh">Human vs Human</option>
          <option value="hvai">Human vs AI</option>
        </select>
      </label>
      <label className="controlGroup">
        AI težina
        <select
          value={aiDifficulty}
          onChange={(event) => onDifficultyChange(event.target.value as AiDifficulty)}
          disabled={mode !== "hvai"}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <label className="controlGroup">
        Početne tačke
        <input
          type="number"
          min={1}
          max={8}
          value={initialPoints}
          onChange={(event) => onInitialPointsChange(Number(event.target.value))}
        />
      </label>
      <div className="buttonRow">
        <button type="button" onClick={onRestart}>
          Restart
        </button>
        <button type="button" onClick={onUndo}>
          Undo
        </button>
      </div>
      <button type="button" className="hintButton" onClick={onHint}>
        Hint
      </button>

      <details className="rulesDrawer">
        <summary>Pravila</summary>
        <ul>
          <li>Tačka sme imati maksimalno 3 veze.</li>
          <li>Linije ne smeju da seku postojeće linije.</li>
          <li>Linije ne smeju prolaziti kroz druge tačke.</li>
          <li>Posle svakog poteza se dodaje nova tačka na liniji.</li>
        </ul>
      </details>

      <div className="history">
        <h3>Istorija poteza</h3>
        <ol>
          {moveHistory.map((move) => (
            <li key={`${move.turnNumber}-${move.spawnedNodeId}`}>
              T{move.turnNumber} P{move.player}: {move.sourceNodeId} {"→"} {move.targetNodeId}
              {move.isLoop ? " (loop)" : ""} + {move.spawnedNodeId}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
