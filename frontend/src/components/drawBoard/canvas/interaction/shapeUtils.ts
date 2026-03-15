import { Graphics } from "pixi.js";
import type { BoardObject } from "../../../../types/board";

export function drawShapeFromObj(g: Graphics, obj: BoardObject) {
  const width = obj.width ?? 200;
  const height = obj.height ?? 120;
  const fill = Number(obj.data?.fill ?? "0xff0000");

  g.clear();

  if (obj.type === "circle") {
    const rx = width / 2;
    const ry = height / 2;
    g.ellipse(rx, ry, rx, ry);
  } else if (obj.type === "triangle") {
    g.moveTo(width / 2, 0);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
  } else if (obj.type === "diamond") {
    g.moveTo(width / 2, 0);
    g.lineTo(width, height / 2);
    g.lineTo(width / 2, height);
    g.lineTo(0, height / 2);
    g.closePath();
  } else {
    g.rect(0, 0, width, height);
  }

  g.fill(fill);
}
