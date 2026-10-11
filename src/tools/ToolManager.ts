import { Grid } from "../model/Grid";
import { ToolContext } from "./ToolContext";
import { ITool } from "./ITool";
import { ArrowTool } from "./ArrowTool";
import { BoxTool } from "./BoxTool";
import { BusTool, BusDirection } from "./BusTool";
import { FreeformTool } from "./FreeformTool";
import { HistoryManager } from "./HistoryManager";
import { LineTool } from "./LineTool";
import { SelectTool, Selection } from "./SelectTool";
import { TextTool } from "./TextTool";
import { ToolId, ToolPointerState } from "./ToolTypes";

type EditorState = {
  text: ReturnType<TextTool["getState"]>;
  selection: Selection | null;
};
export class ToolManager {
  private tools: Map<ToolId, ITool> = new Map();
  private activeTool: ITool;
  private ctx: ToolContext;
  private pointerSnapshot: Grid | null = null;
  private lastEditGroup = "";
  private lastEditTime = 0;
  private pointerMetadata: EditorState | null = null;
  private history = new HistoryManager<EditorState>();

  constructor(grid: Grid, render: () => void) {
    this.ctx = {
      grid,
      setCell: (row, col, value) => grid.setCell(row, col, value),
      getCell: (row, col) => grid.getCell(row, col),
      render,
    };

    this.tools.set("box", new BoxTool());
    this.tools.set("line", new LineTool());
    this.tools.set("bus", new BusTool());
    this.tools.set("arrow", new ArrowTool());
    this.tools.set("freeform", new FreeformTool());
    this.tools.set("eraser", new FreeformTool(true));
    this.tools.set("text", new TextTool());
    this.tools.set("select", new SelectTool());

    this.activeTool = this.tools.get("box")!;
  }

  getSelectTool(): SelectTool {
    return this.tools.get("select") as SelectTool;
  }

  setActiveTool(id: ToolId) {
    const tool = this.tools.get(id);
    if (tool) this.activeTool = tool;
  }

  getActiveToolId(): ToolId {
    return this.activeTool.id as ToolId;
  }

  handlePointerDown(state: ToolPointerState) {
    this.lastEditGroup = "";
    this.pointerSnapshot = this.ctx.grid.clone();
    this.pointerMetadata = this.captureState();
    this.activeTool.onPointerDown(state, this.ctx);
  }

  handlePointerMove(state: ToolPointerState) {
    this.activeTool.onPointerMove(state, this.ctx);
  }

  handlePointerUp(state: ToolPointerState) {
    this.activeTool.onPointerUp(state, this.ctx);
    if (this.pointerSnapshot && !this.ctx.grid.equals(this.pointerSnapshot)) {
      this.history.push(this.pointerSnapshot, this.pointerMetadata!);
    }
    this.pointerSnapshot = null;
  }

  get canUndo() {
    return this.history.canUndo;
  }
  get canRedo() {
    return this.history.canRedo;
  }

  cancelGesture() {
    if (this.pointerSnapshot) this.ctx.grid.loadFromGrid(this.pointerSnapshot);
    this.pointerSnapshot = null;
    this.getSelectTool().clearSelection();
    this.ctx.render();
  }

  setBrushSize(size: number) {
    (this.tools.get("eraser") as FreeformTool).setSize(size);
  }

  setBusOptions(gap: number, direction: BusDirection) {
    (this.tools.get("bus") as BusTool).configure(gap, direction);
  }

  edit(action: (ctx: ToolContext) => void, group = "") {
    const before = this.ctx.grid.clone();
    const metadata = this.captureState();
    action(this.ctx);
    if (!this.ctx.grid.equals(before)) {
      const now = Date.now();
      if (
        !group ||
        group !== this.lastEditGroup ||
        now - this.lastEditTime > 800
      )
        this.history.push(before, metadata);
      this.lastEditGroup = group;
      this.lastEditTime = now;
    } else if (!group) this.lastEditGroup = "";
    this.ctx.render();
  }

  undo() {
    if (this.pointerSnapshot) return;
    this.lastEditGroup = "";
    const prev = this.history.undo(this.ctx.grid, this.captureState());
    if (prev) {
      this.ctx.grid.loadFromGrid(prev.grid);
      this.restoreState(prev.metadata);
      this.ctx.render();
    }
  }

  redo() {
    if (this.pointerSnapshot) return;
    this.lastEditGroup = "";
    const next = this.history.redo(this.ctx.grid, this.captureState());
    if (next) {
      this.ctx.grid.loadFromGrid(next.grid);
      this.restoreState(next.metadata);
      this.ctx.render();
    }
  }

  private captureState(): EditorState {
    const selection = this.getSelectTool().getSelection();
    return {
      text: this.getTextTool().getState(),
      selection: selection ? { ...selection } : null,
    };
  }
  private restoreState(state: EditorState) {
    this.getTextTool().restoreState(
      this.activeTool.id === "text"
        ? state.text
        : { row: null, col: null, lineStart: 0 },
    );
    if (state.selection && this.activeTool.id === "select")
      this.getSelectTool().setSelection({ ...state.selection });
    else this.getSelectTool().clearSelection();
  }

  setFreeformChar(ch: string) {
    const tool = this.tools.get("freeform") as FreeformTool | undefined;
    tool?.setChar(ch);
  }

  getTextTool(): TextTool {
    return this.tools.get("text") as TextTool;
  }
}
