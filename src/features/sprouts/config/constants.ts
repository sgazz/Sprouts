export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 620;

export const POINT_RADIUS = 8;
export const HIT_RADIUS = 16;
export const NEW_POINT_RADIUS = 7;
export const LOOP_OFFSET = 58;
export const CURVE_OFFSET = 32;

export const PATH_SAMPLES = 36;
export const GAME_OVER_SCAN_STEPS = 16;
export const INTERSECTION_EPSILON = 0.001;
export const ENDPOINT_TOLERANCE = 10;
export const NODE_PATH_COLLISION_RADIUS = POINT_RADIUS + 2;
export const AI_MAX_LEGAL_MOVES_SCAN = 220;
export const AI_HARD_SAMPLE = 90;

export const COLORS = {
  background: "#f7f8fb",
  line: "#1f2937",
  point: "#111827",
  pointFill: "#ffffff",
  accent: "#2563eb",
  panelText: "#111827",
  subtleText: "#4b5563",
  panelBg: "#ffffff",
  panelBorder: "#dbe1ea",
  invalid: "#dc2626",
} as const;
