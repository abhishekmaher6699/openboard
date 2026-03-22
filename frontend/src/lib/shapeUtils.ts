import { Graphics, Text, TextStyle, Container } from "pixi.js";
import type { BoardObject } from "../types/board";

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

const BASE_TEXT_STYLE = new TextStyle({
  fontSize: 16,
  fill: 0x1a1a1a,
  wordWrap: true,
  wordWrapWidth: 160,
  align: "center",
  breakWords: true,
});

const STICKY_FOLD_DARKEN = 0.85;

function hexDarken(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function drawShapeFromObj(container: Container, obj: BoardObject) {
  const dark = isDarkMode();

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

    // 🔥 Dark mode shadow adjustment
    g.rect(shadowOffset, shadowOffset, width, height);
    g.fill({
      color: 0x000000,
      alpha: dark ? 0.3 : 0.15,
    });

    g.moveTo(0, 0);
    g.lineTo(width - foldSize, 0);
    g.lineTo(width, foldSize);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fill(fill);
    g.stroke({
      width: 0.5,
      color: hexDarken(fill, dark ? 0.5 : 0.7),
      alpha: 0.5,
    });

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

    const origW =
      obj.data?.origWidth ??
      (points.length >= 4
        ? Math.max(...points.filter((_, i) => i % 2 === 0))
        : width);
    const origH =
      obj.data?.origHeight ??
      (points.length >= 4
        ? Math.max(...points.filter((_, i) => i % 2 !== 0))
        : height);
    const sx = origW > 0 ? width / origW : 1;
    const sy = origH > 0 ? height / origH : 1;

    if (points.length >= 4) {
      g.moveTo(points[0] * sx, points[1] * sy);
      for (let i = 2; i < points.length; i += 2) {
        g.lineTo(points[i] * sx, points[i + 1] * sy);
      }
      g.stroke({
        width: strokeWidth,
        color: strokeColor,
        cap: "round",
        join: "round",
      });
    }
  } else if (obj.type === "line") {
    const x1 = obj.data?.x1 ?? 0;
    const y1 = obj.data?.y1 ?? 0;
    const x2 = obj.data?.x2 ?? obj.width ?? 200;
    const y2 = obj.data?.y2 ?? 0;
    const strokeColor = Number(obj.data?.fill ?? "0x000000");
    const strokeWidth = obj.data?.strokeWidth ?? 3;

    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke({ width: strokeWidth, color: strokeColor, cap: "round" });
  } else {
    g.rect(0, 0, width, height);
    g.fill(fill);
  }

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

    // 🔥 Dark mode default text color
    const textColor = obj.data?.textColor
      ? parseInt(obj.data.textColor.replace("#", ""), 16)
      : dark
        ? 0xe5e5e5
        : 0x1a1a1a;

    t.style.fill = textColor;

    t.text = text;
    t.anchor.set(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
    t.x = align === "left" ? 12 : align === "right" ? width - 12 : width / 2;
    t.y = obj.type === "sticky" ? height / 2 + 4 : height / 2;
    t.visible = true;
  } else {
    if (t) t.visible = false;
  }
}
