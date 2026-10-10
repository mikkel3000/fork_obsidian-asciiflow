import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";
import { charWidth } from "../model/CharWidth";

export class TextTool implements ITool {
  id = "text";

  /** Current cursor position (null = not active) */
  private lineStart = 0;
  private cursorRow: number | null = null;
  private cursorCol: number | null = null;

  /** Callback to notify UI that cursor moved (so renderer can show it) */
  private onCursorChange?: (row: number | null, col: number | null) => void;

  setOnCursorChange(cb: (row: number | null, col: number | null) => void) {
    this.onCursorChange = cb;
  }

  getCursor(): { row: number; col: number } | null {
    if (this.cursorRow === null || this.cursorCol === null) return null;
    return { row: this.cursorRow, col: this.cursorCol };
  }

  getState() {
    return {
      row: this.cursorRow,
      col: this.cursorCol,
      lineStart: this.lineStart,
    };
  }
  restoreState(state: ReturnType<TextTool["getState"]>) {
    this.cursorRow = state.row;
    this.cursorCol = state.col;
    this.lineStart = state.lineStart;
    this.onCursorChange?.(state.row, state.col);
  }

  isActive(): boolean {
    return this.cursorRow !== null;
  }

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    // Place cursor at click position
    this.cursorRow = state.row;
    this.cursorCol = state.col;
    this.lineStart = state.col;
    this.onCursorChange?.(this.cursorRow, this.cursorCol);
    ctx.render();
  }

  onPointerMove(): void {}

  onPointerUp(): void {}

  /** Handle a printable character key */
  handleChar(ch: string, ctx: ToolContext) {
    if (this.cursorRow === null || this.cursorCol === null) return;
    const width = charWidth(ch);
    ctx.setCell(this.cursorRow, this.cursorCol, ch);
    if (width > 1) {
      // Clear the trailing cell to avoid overlapping characters
      ctx.setCell(this.cursorRow, this.cursorCol + 1, "");
    }
    this.cursorCol += width;
    this.onCursorChange?.(this.cursorRow, this.cursorCol);
    ctx.render();
  }

  /** Handle special keys like Backspace, Enter, Escape, arrows */
  handleKey(key: string, ctx: ToolContext): boolean {
    if (this.cursorRow === null || this.cursorCol === null) return false;

    switch (key) {
      case "Backspace":
        if (this.cursorCol > 0) {
          let targetCol = this.cursorCol - 1;
          const prevCell = ctx.getCell(this.cursorRow, targetCol);
          if (!prevCell && targetCol - 1 >= 0) {
            const possibleFull = ctx.getCell(this.cursorRow, targetCol - 1);
            if (charWidth(possibleFull) > 1) {
              targetCol = targetCol - 1;
            }
          }
          const width = charWidth(ctx.getCell(this.cursorRow, targetCol));
          ctx.setCell(this.cursorRow, targetCol, "");
          if (width > 1) {
            ctx.setCell(this.cursorRow, targetCol + 1, "");
          }
          this.cursorCol = targetCol;
        }
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "Delete":
        {
          const width = charWidth(ctx.getCell(this.cursorRow, this.cursorCol));
          ctx.setCell(this.cursorRow, this.cursorCol, "");
          if (width > 1) {
            ctx.setCell(this.cursorRow, this.cursorCol + 1, "");
          }
        }
        ctx.render();
        return true;
      case "Enter":
        this.cursorRow += 1;
        this.cursorCol = this.lineStart;
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "ArrowLeft":
        this.cursorCol = Math.max(0, this.cursorCol - 1);
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "ArrowRight":
        this.cursorCol += 1;
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "ArrowUp":
        this.cursorRow = Math.max(0, this.cursorRow - 1);
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "ArrowDown":
        this.cursorRow += 1;
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      case "Escape":
        this.cursorRow = null;
        this.cursorCol = null;
        this.onCursorChange?.(null, null);
        ctx.render();
        return true;
      case "Tab":
        // Insert 4 spaces
        for (let i = 0; i < 4; i++) {
          ctx.setCell(this.cursorRow, this.cursorCol, " ");
          this.cursorCol += 1;
        }
        this.onCursorChange?.(this.cursorRow, this.cursorCol);
        ctx.render();
        return true;
      default:
        return false;
    }
  }

  /** Deactivate the text cursor */
  deactivate() {
    this.cursorRow = null;
    this.cursorCol = null;
    this.onCursorChange?.(null, null);
  }

  /** Paste external text at the current cursor position */
  pasteText(text: string, ctx: ToolContext) {
    if (this.cursorRow === null || this.cursorCol === null) return;
    const startRow = this.cursorRow,
      startCol = this.cursorCol;
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    for (let r = 0; r < lines.length; r++) {
      let col = startCol;
      for (const ch of lines[r]) {
        ctx.setCell(startRow + r, col, ch);
        if (charWidth(ch) === 2) ctx.setCell(startRow + r, col + 1, "");
        col += charWidth(ch);
      }
      this.cursorCol = col;
    }
    this.cursorRow = startRow + lines.length - 1;
    this.lineStart = startCol;
    this.onCursorChange?.(this.cursorRow, this.cursorCol);
    ctx.render();
  }
}
