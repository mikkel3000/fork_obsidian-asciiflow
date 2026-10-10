export type GridCellKey = string;

export type GridCell = {
  row: number;
  col: number;
  value: string;
};

export type GridSize = {
  rows: number;
  cols: number;
};

export class Grid {
  private cells: Map<GridCellKey, string> = new Map();
  private size: GridSize;

  constructor(rows = 40, cols = 120) {
    this.size = { rows, cols };
  }

  static key(row: number, col: number) {
    return `${row}:${col}`;
  }

  getSize(): GridSize {
    return { ...this.size };
  }

  resize(rows: number, cols: number) {
    this.size = { rows, cols };
    for (const key of this.cells.keys()) {
      const [r, c] = key.split(":").map(Number);
      if (r >= rows || c >= cols) {
        this.cells.delete(key);
      }
    }
  }

  clear() {
    this.cells.clear();
  }

  getCell(row: number, col: number): string {
    return this.cells.get(Grid.key(row, col)) ?? "";
  }

  setCell(row: number, col: number, value: string) {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0)
      return;
    const key = Grid.key(row, col);
    if (!value || value === " ") {
      this.cells.delete(key);
      return;
    }
    this.size.rows = Math.max(this.size.rows, row + 1);
    this.size.cols = Math.max(this.size.cols, col + 1);
    this.cells.set(key, value);
  }

  forEachCell(callback: (cell: GridCell) => void) {
    for (const [key, value] of this.cells.entries()) {
      const [row, col] = key.split(":").map(Number);
      callback({ row, col, value });
    }
  }

  getBounds() {
    let endRow = 0,
      endCol = 0;
    this.forEachCell(({ row, col }) => {
      endRow = Math.max(endRow, row);
      endCol = Math.max(endCol, col + 1);
    });
    return { endRow, endCol };
  }

  equals(other: Grid): boolean {
    if (
      this.size.rows !== other.size.rows ||
      this.size.cols !== other.size.cols ||
      this.cells.size !== other.cells.size
    )
      return false;
    for (const [key, value] of this.cells) {
      if (other.cells.get(key) !== value) return false;
    }
    return true;
  }

  clone(): Grid {
    const cloned = new Grid(this.size.rows, this.size.cols);
    cloned.cells = new Map(this.cells);
    return cloned;
  }

  loadFromGrid(other: Grid) {
    const { rows, cols } = other.getSize();
    this.size = { rows, cols };
    this.cells = new Map(other.cells);
  }
}
