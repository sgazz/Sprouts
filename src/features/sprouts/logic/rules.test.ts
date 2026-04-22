import { describe, expect, test } from "vitest";
import { validateMove } from "./rules";
import type { Edge, Point } from "./types";

describe("move rules", () => {
  test("rejects move when endpoint degree is 3", () => {
    const points: Point[] = [
      { id: "a", x: 100, y: 100, degree: 3 },
      { id: "b", x: 260, y: 100, degree: 0 },
    ];

    const result = validateMove({ points, edges: [], fromId: "a", toId: "b" });
    expect(result.ok).toBe(false);
  });

  test("rejects crossing line", () => {
    const points: Point[] = [
      { id: "a", x: 100, y: 100, degree: 0 },
      { id: "b", x: 300, y: 300, degree: 0 },
      { id: "c", x: 100, y: 300, degree: 0 },
      { id: "d", x: 300, y: 100, degree: 0 },
    ];

    const edges: Edge[] = [
      {
        id: "e-1",
        from: "a",
        to: "b",
        createdBy: 1,
        insertedPointId: "x",
        path: [
          { x: 100, y: 100 },
          { x: 300, y: 300 },
        ],
      },
    ];

    const result = validateMove({ points, edges, fromId: "c", toId: "d" });
    expect(result.ok).toBe(false);
  });
});
