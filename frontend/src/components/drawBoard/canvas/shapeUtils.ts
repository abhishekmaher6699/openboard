import { Graphics } from "pixi.js"
import type { BoardObject } from "../../../types/board"

export function drawShape(g: Graphics, type: string, width: number, height: number) {
  g.clear()

  if (type === "circle") {
    const rx = width / 2
    const ry = height / 2
    g.ellipse(rx, ry, rx, ry)
  } else {
    g.rect(0, 0, width, height)
  }

  g.fill(0xff0000)
}

export function drawShapeFromObj(g: Graphics, obj: BoardObject) {
  drawShape(g, obj.type, obj.width ?? 200, obj.height ?? 120)
}