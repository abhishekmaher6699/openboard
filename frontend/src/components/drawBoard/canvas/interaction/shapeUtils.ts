import { Graphics, Text, TextStyle, Container } from "pixi.js";
import type { BoardObject } from "../../../../types/board";

const TEXT_STYLE = new TextStyle({
  fontSize: 16,
  fill: 0x1a1a1a,
  wordWrap: true,
  wordWrapWidth: 160,
  align: "center",
  breakWords: true,
})

export function drawShapeFromObj(container: Container, obj: BoardObject) {
  const width = obj.width ?? 200;
  const height = obj.height ?? 120;
  const fill = Number(obj.data?.fill ?? "0xff0000");
  const text = obj.data?.text ?? "";

  let g = container.getChildByName("shape") as Graphics
  if (!g) {
    g = new Graphics()
    g.name = "shape"
    container.addChildAt(g, 0)
  }

  g.clear()

  if (obj.type !== "text") {
    if (obj.type === "circle") {
      g.ellipse(width / 2, height / 2, width / 2, height / 2);
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

  let t = container.getChildByName("label") as Text
  if (!t) {
    t = new Text({ text: "", style: TEXT_STYLE.clone() })
    t.name = "label"
    container.addChild(t)
  }

  t.style.wordWrapWidth = width - 24
  t.text = text
  t.anchor.set(0.5, 0.5)
  t.x = width / 2
  t.y = height / 2
  t.visible = text.length > 0
}