import { Graphics, Text, TextStyle, Container } from "pixi.js";
import type { BoardObject } from "../types/board";

const BASE_TEXT_STYLE = new TextStyle({
  fontSize: 16,
  fill: 0x1a1a1a,
  wordWrap: true,
  wordWrapWidth: 160,
  align: "center",
  breakWords: true,
});

// sticky note colors — slightly darker shade used for the fold corner
const STICKY_FOLD_DARKEN = 0.85;

function hexDarken(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function drawShapeFromObj(container: Container, obj: BoardObject) {
  const width = obj.width ?? 200;
  const height = obj.height ?? 120;
  const fill = Number(obj.data?.fill ?? "0xffd700");
  const text = obj.data?.text ?? "";

  const fontSize = obj.data?.fontSize ?? 16;
  const bold = obj.data?.bold ?? false;
  const italic = obj.data?.italic ?? false;
  const align = obj.data?.align ?? "center";
  const fontFamily = obj.data?.fontFamily ?? "sans-serif";

  let g = container.getChildByName("shape") as Graphics;
  if (!g) {
    g = new Graphics();
    g.name = "shape";
    container.addChildAt(g, 0);
  }

  g.clear();

  if (obj.type === "sticky") {
    const foldSize = Math.min(20, width * 0.12);
    const shadowOffset = 4;

    // drop shadow
    g.rect(shadowOffset, shadowOffset, width, height);
    g.fill({ color: 0x000000, alpha: 0.15 });

    // main body with folded corner (top-right)
    g.moveTo(0, 0);
    g.lineTo(width - foldSize, 0);
    g.lineTo(width, foldSize);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fill(fill);
    g.stroke({ width: 0.5, color: hexDarken(fill, 0.7), alpha: 0.5 });

    // fold triangle
    const foldColor = hexDarken(fill, STICKY_FOLD_DARKEN);
    g.moveTo(width - foldSize, 0);
    g.lineTo(width, foldSize);
    g.lineTo(width - foldSize, foldSize);
    g.closePath();
    g.fill(foldColor);
  } else if (obj.type === "text") {
    // no background
  } else if (obj.type === "circle") {
    g.ellipse(width / 2, height / 2, width / 2, height / 2);
    g.fill(fill);
  } else if (obj.type === "triangle") {
    g.moveTo(width / 2, 0);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fill(fill);
  } else if (obj.type === "diamond") {
    g.moveTo(width / 2, 0);
    g.lineTo(width, height / 2);
    g.lineTo(width / 2, height);
    g.lineTo(0, height / 2);
    g.closePath();
    g.fill(fill);
  } else if (obj.type == "path") {
    const points: number[] = obj.data?.points ?? [];
    const strokeColor = Number(obj.data?.fill ?? "0x000000");
    const strokeWidth = obj.data?.strokeWidth ?? 3;

    if (points.length >= 4) {
      g.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) {
        g.lineTo(points[i], points[i + 1]);
      }
      g.stroke({
        width: strokeWidth,
        color: strokeColor,
        cap: "round",
        join: "round",
      });
    }
  } else {
    g.rect(0, 0, width, height);
    g.fill(fill);
  }

  // text label — only for sticky and freestanding text
  const showText = obj.type === "sticky" || obj.type === "text";

  let t = container.getChildByName("label") as Text;
  if (showText) {
    if (!t) {
      t = new Text({ text: "", style: BASE_TEXT_STYLE.clone() });
      t.name = "label";
      container.addChild(t);
    }

    t.style.fontSize = fontSize;
    t.style.fontWeight = bold ? "bold" : "normal";
    t.style.fontStyle = italic ? "italic" : "normal";
    t.style.align = align;
    t.style.fontFamily = fontFamily;
    t.style.wordWrap = true;
    t.style.wordWrapWidth = width - 24;
    t.style.breakWords = true;
    const textColor = obj.data?.textColor
      ? parseInt(obj.data.textColor.replace("#", ""), 16)
      : 0x1a1a1a;
    t.style.fill = textColor;

    t.text = text;
    t.anchor.set(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
    t.x = align === "left" ? 12 : align === "right" ? width - 12 : width / 2;
    // shift text up slightly on sticky to avoid the fold
    t.y = obj.type === "sticky" ? height / 2 + 4 : height / 2;
    t.visible = true;
  } else {
    // hide label if it exists but type doesn't support text
    if (t) t.visible = false;
  }
}
