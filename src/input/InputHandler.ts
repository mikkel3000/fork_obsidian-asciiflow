import { screenToCell } from "./CoordinateMapper";
import { Point } from "../model/Drawing";
import { ToolPointerState } from "../tools/ToolTypes";
export type InputHandlerOptions = {
  cellWidth: number;
  cellHeight: number;
  view: () => { x: number; y: number; zoom: number };
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, x: number, y: number) => void;
  down: (state: ToolPointerState) => void;
  move: (state: ToolPointerState) => void;
  up: (state: ToolPointerState) => void;
  hover: (point: Point | null, shift: boolean) => void;
  cancel: () => void;
};
export class InputHandler {
  private pointer: number | null = null;
  private space = false;
  private panning = false;
  private start: Point = { row: 0, col: 0 };
  private last: Point = { row: 0, col: 0 };
  private client = { x: 0, y: 0 };
  private win: Window;
  constructor(
    private canvas: HTMLCanvasElement,
    private options: InputHandlerOptions,
  ) {
    this.win = canvas.ownerDocument.defaultView!;
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
    canvas.addEventListener("pointerleave", this.leave);
    canvas.addEventListener("wheel", this.wheel, { passive: false });
    this.win.addEventListener("keydown", this.keydown);
    this.win.addEventListener("keyup", this.keyup);
    this.win.addEventListener("blur", this.blur);
  }
  detach() {
    this.canvas.removeEventListener("pointerdown", this.down);
    this.canvas.removeEventListener("pointermove", this.move);
    this.canvas.removeEventListener("pointerup", this.up);
    this.canvas.removeEventListener("pointercancel", this.cancel);
    this.canvas.removeEventListener("pointerleave", this.leave);
    this.canvas.removeEventListener("wheel", this.wheel);
    this.win.removeEventListener("keydown", this.keydown);
    this.win.removeEventListener("keyup", this.keyup);
    this.win.removeEventListener("blur", this.blur);
  }
  private keydown = (e: KeyboardEvent) => {
    if (e.code === "Space" && e.target === this.canvas) {
      e.preventDefault();
      this.space = true;
      this.canvas.classList.add("panning");
    }
  };
  private keyup = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      this.space = false;
      this.canvas.classList.remove("panning");
    }
  };
  private blur = () => {
    this.space = false;
    this.canvas.classList.remove("panning");
    this.cancel();
  };
  private leave = () => {
    if (this.pointer === null) this.options.hover(null, false);
  };
  private cancel = () => {
    if (this.pointer !== null && !this.panning) this.options.cancel();
    this.pointer = null;
    this.panning = false;
  };
  cell(e: { clientX: number; clientY: number }): Point {
    const rect = this.canvas.getBoundingClientRect(),
      view = this.options.view();
    const p = screenToCell(e.clientX - rect.left, e.clientY - rect.top, {
      ...this.options,
      panX: view.x,
      panY: view.y,
      zoom: view.zoom,
    });
    return { row: Math.max(0, p.row), col: Math.max(0, p.col) };
  }
  private state(e: PointerEvent, dragging: boolean): ToolPointerState {
    return {
      ...this.cell(e),
      startRow: this.start.row,
      startCol: this.start.col,
      isDragging: dragging,
      ctrlKey: e.ctrlKey || e.metaKey,
      shiftKey: e.shiftKey,
    };
  }
  private down = (e: PointerEvent) => {
    if (!e.isPrimary || (e.button !== 0 && e.button !== 1)) return;
    e.preventDefault();
    this.canvas.focus({ preventScroll: true });
    this.pointer = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
    this.start = this.last = this.cell(e);
    this.client = { x: e.clientX, y: e.clientY };
    this.panning = this.space || e.button === 1;
    if (!this.panning) this.options.down(this.state(e, true));
  };
  private move = (e: PointerEvent) => {
    if (this.pointer !== null && e.pointerId !== this.pointer) return;
    if (this.panning) {
      this.options.pan(e.clientX - this.client.x, e.clientY - this.client.y);
      this.client = { x: e.clientX, y: e.clientY };
      return;
    }
    const point = this.cell(e);
    if (this.pointer !== null) this.options.move(this.state(e, true));
    else this.options.hover(point, e.shiftKey);
    this.last = point;
  };
  private up = (e: PointerEvent) => {
    if (e.pointerId !== this.pointer) return;
    if (!this.panning) this.options.up(this.state(e, false));
    this.pointer = null;
    this.panning = false;
    if (this.canvas.hasPointerCapture(e.pointerId))
      this.canvas.releasePointerCapture(e.pointerId);
  };
  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
    if (e.ctrlKey || e.metaKey)
      this.options.zoom(
        Math.exp(-e.deltaY * unit * 0.01),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    else this.options.pan(-e.deltaX * unit, -e.deltaY * unit);
  };
}
