export type ToolId =
  "box" | "line" | "arrow" | "freeform" | "text" | "select" | "eraser";

export type ToolPointerState = {
  startRow: number;
  startCol: number;
  row: number;
  col: number;
  isDragging: boolean;
  ctrlKey: boolean;
  shiftKey?: boolean;
};
