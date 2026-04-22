"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  HIT_RADIUS,
  NEW_POINT_RADIUS,
  POINT_RADIUS,
} from "../config/constants";
import { buildCandidatePath } from "../logic/rules";
import type { Edge, MoveDraft, Point, Vec2 } from "../logic/types";
import type { CandidateMove } from "../logic/types";

interface SproutsCanvasProps {
  points: Point[];
  edges: Edge[];
  draft: MoveDraft | null;
  hoveredPointId: string | null;
  selectedPointId: string | null;
  hintMove: CandidateMove | null;
  onHoverPoint: (pointId: string | null) => void;
  onPointClick: (pointId: string) => void;
  onPointerMove: (position: Vec2, hoveredPointId: string | null) => void;
  onClearDraftPointer: () => void;
}

function drawPath(ctx: CanvasRenderingContext2D, path: Vec2[], color: string, width = 2): void {
  if (path.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
}

export function SproutsCanvas({
  points,
  edges,
  draft,
  hoveredPointId,
  selectedPointId,
  hintMove,
  onHoverPoint,
  onPointClick,
  onPointerMove,
  onClearDraftPointer,
}: SproutsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pointMap = useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    edges.forEach((edge) => {
      drawPath(ctx, edge.path, COLORS.line, 2.5);
      const inserted = pointMap.get(edge.insertedPointId);
      if (inserted) {
        ctx.beginPath();
        ctx.fillStyle = COLORS.accent;
        ctx.arc(inserted.x, inserted.y, NEW_POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (draft?.fromId) {
      const from = pointMap.get(draft.fromId);
      if (from) {
        const targetId = draft.toId ?? draft.fromId;
        const previewPath = buildCandidatePath({ points, edges, fromId: from.id, toId: targetId });
        if (previewPath) {
          drawPath(ctx, previewPath, COLORS.accent, 1.5);
        } else if (draft.pointer) {
          drawPath(ctx, [from, draft.pointer], COLORS.accent, 1.5);
        }
      }
    }

    if (hintMove) {
      const hintPath = buildCandidatePath({
        points,
        edges,
        fromId: hintMove.fromId,
        toId: hintMove.toId,
      });
      if (hintPath) {
        ctx.setLineDash([7, 6]);
        drawPath(ctx, hintPath, "#10b981", 2.2);
        ctx.setLineDash([]);
      }
    }

    points.forEach((point) => {
      const isHovered = point.id === hoveredPointId;
      const isSelected = point.id === selectedPointId;
      ctx.beginPath();
      ctx.fillStyle = COLORS.pointFill;
      ctx.strokeStyle = isSelected || isHovered ? COLORS.accent : COLORS.point;
      ctx.lineWidth = isSelected || isHovered ? 3 : 2;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [draft, edges, hoveredPointId, hintMove, pointMap, points, selectedPointId]);

  function getCanvasPos(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>): Vec2 {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function findHitPoint(position: Vec2): Point | null {
    for (const point of points) {
      const dist = Math.hypot(point.x - position.x, point.y - position.y);
      if (dist <= HIT_RADIUS) return point;
    }
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="sproutsCanvas"
      onPointerMove={(event) => {
        const pos = getCanvasPos(event);
        const hit = findHitPoint(pos);
        onPointerMove(pos, hit?.id ?? null);
        onHoverPoint(hit?.id ?? null);
      }}
      onPointerLeave={() => {
        onHoverPoint(null);
        onClearDraftPointer();
      }}
      onPointerUp={(event) => {
        const pos = getCanvasPos(event);
        const hit = findHitPoint(pos);
        if (hit) onPointClick(hit.id);
      }}
      style={{ touchAction: "none" }}
    />
  );
}
