import { Graphics } from "pixi.js";
import { Viewport } from "pixi-viewport";

export function createGrid(viewport: Viewport) {
  const grid = new Graphics();

  viewport.addChild(grid);

  function draw() {
    grid.clear();

    const gridSize = 100;
    const bounds = viewport.getVisibleBounds();

    const startX = Math.floor(bounds.x / gridSize) * gridSize;
    const startY = Math.floor(bounds.y / gridSize) * gridSize;

    const endX = bounds.x + bounds.width;
    const endY = bounds.y + bounds.height;

    grid.setStrokeStyle({ width: 1, color: 0xe5e5e5 });

    for (let x = startX; x < endX; x += gridSize) {
      grid.moveTo(x, startY);
      grid.lineTo(x, endY);
    }

    for (let y = startY; y < endY; y += gridSize) {
      grid.moveTo(startX, y);
      grid.lineTo(endX, y);
    }

    grid.stroke();
  }

  viewport.on("moved", draw);
  draw();
}