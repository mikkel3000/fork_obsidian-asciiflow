import { Grid } from "../model/Grid";
import { bounds, drawBox } from "../model/Drawing";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";
export class BoxTool implements ITool {
  id = "box";
  private base: Grid | null = null;
  onPointerDown(s: ToolPointerState, ctx: ToolContext) {
    this.base = ctx.grid.clone();
    this.draw(s, ctx);
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
    if (this.base) ctx.grid.loadFromGrid(this.base);
    drawBox(ctx.grid, bounds([{ row: s.startRow, col: s.startCol }, s]));
    ctx.render();
  }
}
