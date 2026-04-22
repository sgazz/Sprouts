"use client";

import { useEffect, useMemo, useState } from "react";
import { GamePanel } from "@/features/sprouts/components/GamePanel";
import { SproutsCanvas } from "@/features/sprouts/components/SproutsCanvas";
import {
  applyMove,
  clearHint,
  createInitialState,
  resetGame,
  selectStartPoint,
  setHintMove,
  undoMove,
} from "@/features/sprouts/logic/game";
import type { AiDifficulty, GameMode, MoveDraft, Vec2 } from "@/features/sprouts/logic/types";
import { chooseAiMove } from "@/lib/sprouts/ai";
import { generateLegalMoves } from "@/lib/sprouts/legalMoveGeneration";
import { scoreMoveByFutureOptions } from "@/lib/sprouts/scoring";

export default function Home() {
  const [initialPoints, setInitialPoints] = useState(3);
  const [mode, setModeState] = useState<GameMode>("hvh");
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>("easy");
  const [game, setGame] = useState(() => createInitialState(3, "hvh", "easy"));
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MoveDraft | null>(null);

  const selectableSet = useMemo(() => {
    return new Set(game.points.filter((p) => p.degree < 3).map((p) => p.id));
  }, [game.points]);

  function handlePointClick(pointId: string): void {
    if (game.gameOver) return;
    if (!selectableSet.has(pointId)) {
      setGame((prev) => ({ ...prev, statusText: "Tačka nema slobodan stepen." }));
      return;
    }

    if (!game.selectedPointId) {
      setGame((prev) => selectStartPoint(prev, pointId));
      setDraft({ fromId: pointId, toId: pointId, pointer: null });
      return;
    }

    setGame((prev) => {
      if (!prev.selectedPointId) return prev;
      return applyMove(prev, prev.selectedPointId, pointId);
    });
    setDraft(null);
  }

  function handlePointerMove(position: Vec2, hoveredId: string | null): void {
    setDraft((prev) => {
      if (!prev) return null;
      return { ...prev, pointer: position, toId: hoveredId };
    });
  }

  function handleRestart(): void {
    setGame(resetGame(initialPoints, mode, aiDifficulty));
    setDraft(null);
    setHoveredPointId(null);
  }

  function handleInitialPointsChange(count: number): void {
    const clamped = Math.max(1, Math.min(8, Number.isNaN(count) ? 3 : count));
    setInitialPoints(clamped);
    setGame(resetGame(clamped, mode, aiDifficulty));
    setDraft(null);
    setHoveredPointId(null);
  }

  function handleModeChange(nextMode: GameMode): void {
    setModeState(nextMode);
    setGame((prev) => resetGame(prev.initialPoints, nextMode, aiDifficulty));
    setDraft(null);
  }

  function handleDifficultyChange(difficulty: AiDifficulty): void {
    setAiDifficulty(difficulty);
    setGame((prev) => resetGame(prev.initialPoints, mode, difficulty));
    setDraft(null);
  }

  function handleUndo(): void {
    setGame((prev) => undoMove(prev));
    setDraft(null);
  }

  function handleHint(): void {
    setGame((prev) => {
      const legal = generateLegalMoves(prev.points, prev.edges, 120);
      if (legal.length === 0) return { ...prev, statusText: "Nema legalnog poteza za hint." };

      let chosen = legal[0];
      if (prev.mode === "hvai") {
        const ranked = [...legal]
          .map((move) => ({ move, score: scoreMoveByFutureOptions(prev.points, prev.edges, move) }))
          .sort((a, b) => b.score - a.score);
        chosen = ranked[0].move;
      }

      return setHintMove(prev, chosen.fromId, chosen.toId);
    });
  }

  useEffect(() => {
    if (game.mode !== "hvai" || game.currentPlayer !== 2 || game.gameOver || !game.pendingAi) {
      return;
    }

    const timer = setTimeout(() => {
      setGame((prev) => {
        const aiMove = chooseAiMove(prev.points, prev.edges, prev.aiDifficulty);
        if (!aiMove) {
          return {
            ...prev,
            gameOver: true,
            winner: 1,
            statusText: "AI nema legalan potez. Pobeđuje igrač 1.",
            pendingAi: false,
          };
        }
        return applyMove({ ...prev, pendingAi: false }, aiMove.fromId, aiMove.toId);
      });
    }, 220);

    return () => clearTimeout(timer);
  }, [game.mode, game.currentPlayer, game.gameOver, game.pendingAi, game.aiDifficulty]);

  return (
    <main className="pageWrap">
      <h1>Klica - Phase 2</h1>
      <section className="gameLayout">
        <div className="boardWrap">
          <SproutsCanvas
            points={game.points}
            edges={game.edges}
            draft={draft}
            hoveredPointId={hoveredPointId}
            selectedPointId={game.selectedPointId}
            hintMove={game.hintMove}
            onHoverPoint={setHoveredPointId}
            onPointClick={handlePointClick}
            onPointerMove={handlePointerMove}
            onClearDraftPointer={() => {
              setDraft((prev) => (prev ? { ...prev, pointer: null } : null));
            }}
          />
          {game.gameOver ? (
            <div className="winnerOverlay">
              <h3>Kraj igre</h3>
              <p>Pobednik: Igrač {game.winner}</p>
              <button type="button" onClick={handleRestart}>
                Nova partija
              </button>
            </div>
          ) : null}
        </div>
        <GamePanel
          currentPlayer={game.currentPlayer}
          statusText={game.statusText}
          initialPoints={initialPoints}
          gameOver={game.gameOver}
          mode={game.mode}
          aiDifficulty={game.aiDifficulty}
          moveHistory={game.moveHistory}
          pendingAi={game.pendingAi}
          onRestart={handleRestart}
          onUndo={handleUndo}
          onHint={() => {
            setGame((prev) => clearHint(prev));
            handleHint();
          }}
          onInitialPointsChange={handleInitialPointsChange}
          onModeChange={handleModeChange}
          onDifficultyChange={handleDifficultyChange}
        />
      </section>
    </main>
  );
}
