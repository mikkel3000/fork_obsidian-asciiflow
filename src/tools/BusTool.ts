import { Grid } from "../model/Grid";
import { drawPath, rasterLine } from "../model/Drawing";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export type BusDirection = "auto" | "horizontal" | "vertical";
export class BusTool implements ITool {
  id = "bus";
  private base: Grid | null = null;
  private axis: BusDirection = "auto";
  private direction: BusDirection = "auto";
  private gap = 0;

  configure(gap: number, direction: BusDirection) {
    this.gap = gap;
    this.direction = direction;
  }
  onPointerDown(_s: ToolPointerState, ctx: ToolContext) {
    this.base = ctx.grid.clone();
    this.axis = this.direction;
  }
  onPointerMove(s: ToolPointerState, ctx: ToolContext) {
    if (s.isDragging) this.draw(s, ctx);
  }
  onPointerUp(s: ToolPointerState, ctx: ToolContext) {
    this.draw(s, ctx);
    this.base = null;
  }
  private draw(s: ToolPointerState, ctx: ToolContext) {
    if (!this.base) return;
    ctx.grid.loadFromGrid(this.base);
    const dr = s.row - s.startRow,
      dc = s.col - s.startCol;
    if (this.axis === "auto" && (dr || dc))
      this.axis = Math.abs(dc) >= Math.abs(dr) ? "horizontal" : "vertical";
    const horizontal = this.axis !== "vertical";
    if (horizontal ? dc !== 0 : dr !== 0) {
      // The drag anchors the top/left edge; the second edge grows down/right.
      for (const offset of this.gap ? [0, this.gap + 1] : [0]) {
        const start = {
          row: s.startRow + (horizontal ? offset : 0),
          col: s.startCol + (horizontal ? 0 : offset),
        };
        const end = {
          row: horizontal ? start.row : s.row,
          col: horizontal ? s.col : start.col,
        };
        drawPath(
          ctx.grid,
          rasterLine(start, end),
          false,
          true,
          horizontal ? "horizontal" : "vertical",
        );
      }
    }
    ctx.render();
  }
}
