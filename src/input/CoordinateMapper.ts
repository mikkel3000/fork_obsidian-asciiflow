export type CoordinateMapperOptions = {
  cellWidth: number;
  cellHeight: number;
  panX: number;
  panY: number;
  zoom: number;
};

export function screenToCell(
  x: number,
  y: number,
  options: CoordinateMapperOptions,
) {
  const { cellWidth, cellHeight, panX, panY, zoom } = options;
  const worldX = (x - panX) / zoom;
  const worldY = (y - panY) / zoom;

  return {
    row: Math.floor(worldY / cellHeight),
    col: Math.floor(worldX / cellWidth),
  };
}
