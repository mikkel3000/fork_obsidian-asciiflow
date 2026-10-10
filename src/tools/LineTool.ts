import { Grid } from "../model/Grid";
import { drawPath, Point, route, samePoint } from "../model/Drawing";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";
export class LineTool implements ITool {
  id = "line";
  protected arrow = false;
  private base: Grid | null = null;
  private vertices: Point[] = [];
  private axis: "horizontal" | "vertical" | null = null;
  private last: Point = { row: 0, col: 0 };
  onPointerDown(s: ToolPointerState, ctx: ToolContext) {
    this.base = ctx.grid.clone();
    this.vertices = [{ row: s.row, col: s.col }];
    this.last = { row: s.row, col: s.col };
    this.axis = null;
  }
  onPointerMove(s: ToolPointerState, ctx: ToolContext) {
    if (s.isDragging) this.draw(s, ctx);
  }
  onPointerUp(s: ToolPointerState, ctx: ToolContext) {
    if (s.row === s.startRow && s.col === s.startCol && this.base) {
      ctx.grid.loadFromGrid(this.base);
      ctx.render();
    } else this.draw(s, ctx);
    this.base = null;
  }
  private draw(s: ToolPointerState, ctx: ToolContext) {
    if (!this.base) return;
    const anchor = this.vertices[this.vertices.length - 1];
    if (!this.axis)
      this.axis =
        Math.abs(s.col - anchor.col) >= Math.abs(s.row - anchor.row)
          ? "horizontal"
          : "vertical";
    const cross =
      this.axis === "horizontal"
        ? Math.abs(s.row - anchor.row)
        : Math.abs(s.col - anchor.col);
    // Ignore small hand jitter; preserve a corner after a deliberate turn.
    if (cross >= 2 && !samePoint(this.last, anchor)) {
      const corner =
        this.axis === "horizontal"
          ? { row: anchor.row, col: this.last.col }
          : { row: this.last.row, col: anchor.col };
      if (!samePoint(corner, anchor)) this.vertices.push(corner);
      this.axis = this.axis === "horizontal" ? "vertical" : "horizontal";
    }
    let points: Point[] = [];
    for (let i = 1; i < this.vertices.length; i++)
      points.push(
        ...route(this.vertices[i - 1], this.vertices[i]).slice(i === 1 ? 0 : 1),
      );
    const tail = route(
      this.vertices[this.vertices.length - 1],
      s,
      this.axis === "vertical",
    );
    points.push(...tail.slice(points.length ? 1 : 0));
    if (s.shiftKey)
      points = route({ row: s.startRow, col: s.startCol }, s, true);
    this.last = { row: s.row, col: s.col };
    ctx.grid.loadFromGrid(this.base);
    drawPath(ctx.grid, points, this.arrow);
    ctx.render();
  }
}
