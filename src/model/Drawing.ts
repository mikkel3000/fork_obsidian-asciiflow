import { charWidth } from "./CharWidth";
import { Grid } from "./Grid";
export type Point = { row: number; col: number };
export type Rect = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};
const N = 1,
  E = 2,
  S = 4,
  W = 8;
export const strokes: Record<string, number> = {
  "│": 5,
  "─": 10,
  "┌": 6,
  "┐": 12,
  "└": 3,
  "┘": 9,
  "├": 7,
  "┤": 13,
  "┬": 14,
  "┴": 11,
  "┼": 15,
};
const glyphs: Record<number, string> = {
  1: "│",
  2: "─",
  4: "│",
  8: "─",
  5: "│",
  10: "─",
  6: "┌",
  12: "┐",
  3: "└",
  9: "┘",
  7: "├",
  13: "┤",
  14: "┬",
  11: "┴",
  15: "┼",
};
export const samePoint = (a: Point, b: Point) =>
  a.row === b.row && a.col === b.col;
export const bounds = (points: Point[]): Rect => ({
  startRow: Math.min(...points.map((p) => p.row)),
  startCol: Math.min(...points.map((p) => p.col)),
  endRow: Math.max(...points.map((p) => p.row)),
  endCol: Math.max(...points.map((p) => p.col)),
});
export const inside = (p: Point, r: Rect) =>
  p.row >= r.startRow &&
  p.row <= r.endRow &&
  p.col >= r.startCol &&
  p.col <= r.endCol;
export function rasterLine(a: Point, b: Point): Point[] {
  const result: Point[] = [];
  let x = a.col,
    y = a.row;
  const dx = Math.abs(b.col - x),
    dy = -Math.abs(b.row - y),
    sx = x < b.col ? 1 : -1,
    sy = y < b.row ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    result.push({ row: y, col: x });
    if (x === b.col && y === b.row) break;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
  return result;
}
export function route(a: Point, b: Point, verticalFirst = false): Point[] {
  const bend = verticalFirst
    ? { row: b.row, col: a.col }
    : { row: a.row, col: b.col };
  return [...rasterLine(a, bend), ...rasterLine(bend, b).slice(1)];
}
function direction(a: Point, b: Point) {
  return b.row < a.row ? N : b.row > a.row ? S : b.col < a.col ? W : E;
}
export function drawPath(
  grid: Grid,
  points: Point[],
  arrow = false,
  join = true,
) {
  const masks = new Map<string, { point: Point; mask: number }>();
  points.forEach((p, i) => {
    let mask = 0;
    if (i) mask |= direction(p, points[i - 1]);
    if (i + 1 < points.length) mask |= direction(p, points[i + 1]);
    const key = Grid.key(p.row, p.col);
    mask |=
      masks.get(key)?.mask ??
      (join ? (strokes[grid.getCell(p.row, p.col)] ?? 0) : 0);
    masks.set(key, { point: p, mask });
  });
  for (const { point: p, mask } of masks.values())
    grid.setCell(p.row, p.col, glyphs[mask] ?? "─");
  if (arrow && points.length > 1) {
    const tip = points[points.length - 1],
      previous = points[points.length - 2];
    // A connector endpoint must always retain its direction, including on borders.
    grid.setCell(
      tip.row,
      tip.col,
      tip.row > previous.row
        ? "▼"
        : tip.row < previous.row
          ? "▲"
          : tip.col > previous.col
            ? "►"
            : "◄",
    );
  }
}
export function boxPoints(r: Rect): Point[] {
  const a = { row: r.startRow, col: r.startCol },
    b = { row: r.startRow, col: r.endCol },
    c = { row: r.endRow, col: r.endCol },
    d = { row: r.endRow, col: r.startCol };
  if (r.startRow === r.endRow || r.startCol === r.endCol)
    return rasterLine(a, c);
  return [
    ...rasterLine(a, b),
    ...rasterLine(b, c).slice(1),
    ...rasterLine(c, d).slice(1),
    ...rasterLine(d, a).slice(1),
  ];
}
export function drawBox(grid: Grid, r: Rect) {
  drawPath(grid, boxPoints(r));
}
export type Shape =
  { kind: "box"; rect: Rect } | { kind: "arrow"; points: Point[] };
export function recognizeShape(grid: Grid, rect: Rect): Shape | null {
  const { startRow: t, startCol: l, endRow: b, endCol: r } = rect;
  const has = (row: number, col: number, mask: number) =>
    ((strokes[grid.getCell(row, col)] ?? 0) & mask) === mask ||
    ("►◄▼▲".includes(grid.getCell(row, col)) && grid.getCell(row, col) !== "");
  if (
    b - t >= 2 &&
    r - l >= 2 &&
    has(t, l, 6) &&
    has(t, r, 12) &&
    has(b, l, 3) &&
    has(b, r, 9) &&
    rasterLine({ row: t, col: l + 1 }, { row: t, col: r - 1 }).every((p) =>
      has(p.row, p.col, 10),
    ) &&
    rasterLine({ row: b, col: l + 1 }, { row: b, col: r - 1 }).every((p) =>
      has(p.row, p.col, 10),
    ) &&
    rasterLine({ row: t + 1, col: l }, { row: b - 1, col: l }).every((p) =>
      has(p.row, p.col, 5),
    ) &&
    rasterLine({ row: t + 1, col: r }, { row: b - 1, col: r }).every((p) =>
      has(p.row, p.col, 5),
    )
  )
    return { kind: "box", rect };
  const cells: Point[] = [];
  grid.forEachCell((p) => {
    if (inside(p, rect)) cells.push(p);
  });
  const tip = cells.find((p) => "►◄▼▲".includes(grid.getCell(p.row, p.col)));
  if (
    !tip ||
    cells.some(
      (p) =>
        !strokes[grid.getCell(p.row, p.col)] &&
        !"►◄▼▲".includes(grid.getCell(p.row, p.col)),
    )
  )
    return null;
  const visited = new Set<string>(),
    points: Point[] = [];
  let current = tip;
  while (current) {
    points.push(current);
    visited.add(Grid.key(current.row, current.col));
    const next = cells.filter(
      (p) =>
        !visited.has(Grid.key(p.row, p.col)) &&
        Math.abs(p.row - current.row) + Math.abs(p.col - current.col) === 1,
    );
    if (next.length > 1) return null;
    current = next[0];
  }
  return points.length === cells.length && points.length > 1
    ? { kind: "arrow", points: points.reverse() }
    : null;
}
export function shapeHandles(shape: Shape | null): Point[] {
  if (!shape) return [];
  if (shape.kind === "arrow")
    return [shape.points[0], shape.points[shape.points.length - 1]];
  const r = shape.rect;
  return [
    { row: r.startRow, col: r.startCol },
    { row: r.startRow, col: r.endCol },
    { row: r.endRow, col: r.endCol },
    { row: r.endRow, col: r.startCol },
  ];
}
export function resizeShape(
  grid: Grid,
  shape: Shape,
  handle: number,
  target: Point,
): Rect {
  if (shape.kind === "box") {
    const old = shape.rect,
      handles = shapeHandles(shape),
      anchor = handles[(handle + 2) % 4];
    const rect = bounds([anchor, target]);
    // Keep every label cell inside the resized border.
    let fits =
      rect.endRow - rect.startRow >= 2 && rect.endCol - rect.startCol >= 2;
    grid.forEachCell((p) => {
      if (
        p.row > old.startRow &&
        p.row < old.endRow &&
        p.col > old.startCol &&
        p.col < old.endCol &&
        !(
          p.row > rect.startRow &&
          p.row < rect.endRow &&
          p.col > rect.startCol &&
          p.col + Math.max(1, charWidth(p.value)) <= rect.endCol
        )
      )
        fits = false;
    });
    if (!fits) return old;
    boxPoints(old).forEach((p) => grid.setCell(p.row, p.col, ""));
    drawBox(grid, rect);
    return rect;
  }
  const points = shape.points;
  const vertices = points.filter(
    (p, i) =>
      i === 0 ||
      i === points.length - 1 ||
      direction(points[i - 1], p) !== direction(p, points[i + 1]),
  );
  vertices[handle === 0 ? 0 : vertices.length - 1] = target;
  points.forEach((p) => grid.setCell(p.row, p.col, ""));
  let path: Point[] = [];
  for (let i = 1; i < vertices.length; i++)
    path.push(
      ...route(
        vertices[i - 1],
        vertices[i],
        i === 1 && points[0].col === points[1].col,
      ).slice(i === 1 ? 0 : 1),
    );
  drawPath(grid, path, true);
  return bounds(path);
}
