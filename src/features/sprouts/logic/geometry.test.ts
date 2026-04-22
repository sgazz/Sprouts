import { describe, expect, test } from "vitest";
import { pointToSegmentDistance, segmentsIntersect } from "./geometry";

describe("geometry helpers", () => {
  test("detects crossing segments", () => {
    const a1 = { x: 0, y: 0 };
    const a2 = { x: 10, y: 10 };
    const b1 = { x: 0, y: 10 };
    const b2 = { x: 10, y: 0 };

    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(true);
  });

  test("distance from point to segment", () => {
    const point = { x: 5, y: 5 };
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };

    expect(pointToSegmentDistance(point, a, b)).toBeCloseTo(5);
  });
});
