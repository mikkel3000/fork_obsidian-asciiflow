import { Grid } from "./Grid";
import {
  bounds,
  inside,
  Point,
  Rect,
  recognizeShape,
  strokes,
} from "./Drawing";
export const isBorder = (value: string) =>
  !!strokes[value] || ("►◄▼▲".includes(value) && value !== "");
export function boxes(grid: Grid): Rect[] {
  const corners: Point[] = [];
  grid.forEachCell((p) => {
    if ((strokes[p.value] & 6) === 6) corners.push(p);
  });
  const result: Rect[] = [];
  for (const a of corners) {
    const ends: Point[] = [];
    grid.forEachCell((p) => {
      if (p.row > a.row && p.col > a.col && (strokes[p.value] & 9) === 9)
        ends.push(p);
    });
    for (const b of ends) {
      const rect = bounds([a, b]);
      if (recognizeShape(grid, rect)?.kind === "box") result.push(rect);
    }
  }
  return result.sort(
    (a, b) =>
      (a.endRow - a.startRow) * (a.endCol - a.startCol) -
      (b.endRow - b.startRow) * (b.endCol - b.startCol),
  );
}
export function enclosingBox(grid: Grid, point: Point) {
  return boxes(grid).find((r) => inside(point, r)) ?? null;
}
export type SelectedCell = Point & { value?: string; restore?: string };
export type SmartRegion = Rect & { cells?: SelectedCell[] };
export function smartRegion(grid: Grid, point: Point): SmartRegion | null {
  const value = grid.getCell(point.row, point.col);
  if (!value) return null;
  if (!isBorder(value) && !/[\p{L}\p{N}]/u.test(value)) {
    const stack = [point],
      seen = new Set<string>(),
      cells: Point[] = [];
    while (stack.length) {
      const p = stack.pop()!,
        key = Grid.key(p.row, p.col);
      if (seen.has(key)) continue;
      seen.add(key);
      const ch = grid.getCell(p.row, p.col);
      if (!ch || isBorder(ch)) continue;
      cells.push(p);
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr || dc) stack.push({ row: p.row + dr, col: p.col + dc });
    }
    return cells.length ? { ...bounds(cells), cells } : null;
  }
  if (!isBorder(value)) {
    // Treat a line of text as a label, keeping adjacent box strokes out.
    let left = point.col,
      right = point.col;
    const textAt = (col: number) => {
      const ch = grid.getCell(point.row, col);
      return !!ch && !isBorder(ch);
    };
    while (
      left > 0 &&
      (textAt(left - 1) ||
        (!grid.getCell(point.row, left - 1) && left > 1 && textAt(left - 2)))
    )
      left--;
    while (
      textAt(right + 1) ||
      (!grid.getCell(point.row, right + 1) && textAt(right + 2))
    )
      right++;
    const cells: Point[] = [];
    for (let col = left; col <= right; col++)
      if (textAt(col)) cells.push({ row: point.row, col });
    return { ...bounds(cells), cells };
  }
  const allBoxes = boxes(grid);
  const boundary = (p: Point, r: Rect) =>
    inside(p, r) &&
    (p.row === r.startRow ||
      p.row === r.endRow ||
      p.col === r.startCol ||
      p.col === r.endCol);
  const borderMask = (p: Point, r: Rect) => {
    if (p.row === r.startRow)
      return p.col === r.startCol ? 6 : p.col === r.endCol ? 12 : 10;
    if (p.row === r.endRow)
      return p.col === r.startCol ? 3 : p.col === r.endCol ? 9 : 10;
    return 5;
  };
  const glyph = (mask: number) =>
    Object.keys(strokes).find((ch) => strokes[ch] === mask) ??
    (mask & 5 ? "│" : "─");
  const masks = (p: Point) => {
    const ch = grid.getCell(p.row, p.col);
    return (
      strokes[ch] ??
      ("►◄".includes(ch) && ch ? 10 : "▼▲".includes(ch) && ch ? 5 : 0)
    );
  };
  const box = allBoxes.find((r) => boundary(point, r));
  const arrow = "►◄▼▲".includes(value);
  if (box && !arrow && !(masks(point) & ~borderMask(point, box))) return box;
  // Include attachment cells, but stop traversal at the box perimeter.
  // Keep each cell's original border stroke so moving a connector repairs it.
  const stack = [point],
    seen = new Set<string>(),
    cells: SelectedCell[] = [];
  const steps = [
    [-1, 0, 1, 4],
    [1, 0, 4, 1],
    [0, -1, 8, 2],
    [0, 1, 2, 8],
  ];
  while (stack.length) {
    const p = stack.pop()!,
      key = Grid.key(p.row, p.col);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isBorder(grid.getCell(p.row, p.col))) continue;
    const attached = allBoxes.find((r) => boundary(p, r));
    if (attached) {
      const base = borderMask(p, attached),
        ch = grid.getCell(p.row, p.col);
      cells.push({
        ...p,
        restore: glyph(base),
        value: "►◄▼▲".includes(ch) ? ch : glyph(masks(p) & ~base),
      });
      if (p.row !== point.row || p.col !== point.col) continue;
    } else cells.push(p);
    for (const [dr, dc, bit, opposite] of steps) {
      const next = { row: p.row + dr, col: p.col + dc };
      if (attached && boundary(next, attached)) continue;
      if (masks(p) & bit && masks(next) & opposite) stack.push(next);
    }
  }
  return cells.length ? { ...bounds(cells), cells } : null;
}

export function textRegion(grid: Grid, rect: Rect): SmartRegion {
  const cells: Point[] = [];
  let border = false;
  grid.forEachCell((p) => {
    if (inside(p, rect)) {
      if (isBorder(p.value)) border = true;
      else cells.push({ row: p.row, col: p.col });
    }
  });
  if (
    !border ||
    !cells.length ||
    boxes(grid).some(
      (b) =>
        inside({ row: b.startRow, col: b.startCol }, rect) &&
        inside({ row: b.endRow, col: b.endCol }, rect),
    )
  )
    return rect;
  return { ...bounds(cells), cells };
}
