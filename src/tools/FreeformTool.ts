import { rasterLine, Point } from "../model/Drawing";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";
export class FreeformTool implements ITool {
  id: string;
  private currentChar = "*";
  private previous: Point | null = null;
  private size = 1;
  constructor(eraser = false) {
    this.id = eraser ? "eraser" : "freeform";
    if (eraser) this.currentChar = "";
  }
  setChar(ch: string) {
    this.currentChar = ch;
  }
  setSize(size: number) {
    this.size = size;
  }
  onPointerDown(s: ToolPointerState, ctx: ToolContext) {
    this.previous = s;
    this.paint(s, ctx);
  }
  onPointerMove(s: ToolPointerState, ctx: ToolContext) {
    if (s.isDragging) this.paint(s, ctx);
  }
  onPointerUp(s: ToolPointerState, ctx: ToolContext) {
    this.paint(s, ctx);
    this.previous = null;
  }
  private paint(s: Point, ctx: ToolContext) {
    const radius = Math.floor(this.size / 2);
    for (const p of rasterLine(this.previous ?? s, s)) {
      for (let r = -radius; r <= radius; r++)
        for (let c = -radius; c <= radius; c++)
          ctx.setCell(p.row + r, p.col + c, this.currentChar);
    }
    this.previous = { row: s.row, col: s.col };
    ctx.render();
  }
}
