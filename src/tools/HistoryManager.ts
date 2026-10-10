import { Grid } from "../model/Grid";
type Snapshot<T> = { grid: Grid; metadata: T };
export class HistoryManager<T = undefined> {
  private past: Snapshot<T>[] = [];
  private future: Snapshot<T>[] = [];
  constructor(private maxSize = 100) {}
  push(grid: Grid, metadata: T) {
    this.past.push({ grid: grid.clone(), metadata });
    if (this.past.length > this.maxSize) this.past.shift();
    this.future = [];
  }
  undo(grid: Grid, metadata: T): Snapshot<T> | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push({ grid: grid.clone(), metadata });
    return previous;
  }
  redo(grid: Grid, metadata: T): Snapshot<T> | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push({ grid: grid.clone(), metadata });
    return next;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  clear() {
    this.past = [];
    this.future = [];
  }
}
