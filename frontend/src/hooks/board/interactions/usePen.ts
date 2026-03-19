import { Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { BoardObject } from "../../../types/board";
import { simplifyPoints, flattenPoints, getBounds } from "../../../lib/penUtils";

type Props = {
  viewportRef: React.RefObject<any>;
  itemsLayerRef: React.RefObject<any>;
  interactionRef: React.RefObject<any>;
  tool: string;
  color: string;
  strokeWidth: number;
  onCreate: (type: string, x: number, y: number, data?: Record<string, any>) => Promise<string | null>;
  disabled?: boolean;
};

function getDefaultPenColor() {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? "#ffffff" : "#000000";
}

export function usePen({
  viewportRef,
  itemsLayerRef,
  interactionRef,
  tool,
  color,
  strokeWidth,
  onCreate,
  disabled,
}: Props) {
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const colorRef = useRef(color);
  colorRef.current = color;

  const strokeWidthRef = useRef(strokeWidth);
  strokeWidthRef.current = strokeWidth;

  useEffect(() => {
    if (disabled) return;

    const viewport = viewportRef.current;
    const itemsLayer = itemsLayerRef.current;
    if (!viewport || !itemsLayer) return;

    const interaction = interactionRef.current;

    let drawing = false;
    let rawPoints: [number, number][] = [];
    let previewGraphics: Graphics | null = null;

    const onDown = (e: any) => {
      if (toolRef.current !== "pen") return;
      e.stopPropagation();

      viewport.plugins.pause("drag");
      drawing = true;
      rawPoints = [];

      const pos = viewport.toWorld(e.global);
      rawPoints.push([pos.x, pos.y]);

      previewGraphics = new Graphics();
      itemsLayer.addChild(previewGraphics);
    };

    const onMove = (e: any) => {
      if (!drawing || toolRef.current !== "pen") return;

      const pos = viewport.toWorld(e.global);
      const last = rawPoints[rawPoints.length - 1];

      if (Math.hypot(pos.x - last[0], pos.y - last[1]) < 2) return;
      rawPoints.push([pos.x, pos.y]);

      if (!previewGraphics) return;

      previewGraphics.clear();

      // 🔥 Theme-aware fallback color
      const effectiveColor =
        colorRef.current === "#000000" || colorRef.current === "#ffffff"
          ? getDefaultPenColor()
          : colorRef.current;

      const strokeColor = Number(effectiveColor.replace("#", "0x"));

      previewGraphics.moveTo(rawPoints[0][0], rawPoints[0][1]);
      for (let i = 1; i < rawPoints.length; i++) {
        previewGraphics.lineTo(rawPoints[i][0], rawPoints[i][1]);
      }

      previewGraphics.stroke({
        width: strokeWidthRef.current,
        color: strokeColor,
        cap: "round",
        join: "round",
      });
    };

    const onUp = async () => {
      if (!drawing || toolRef.current !== "pen") return;

      drawing = false;
      viewport.plugins.resume("drag");

      if (previewGraphics) {
        itemsLayer.removeChild(previewGraphics);
        previewGraphics.destroy();
        previewGraphics = null;
      }

      if (rawPoints.length < 2) return;

      const simplified = simplifyPoints(rawPoints, 2);
      if (simplified.length < 2) return;

      const bounds = getBounds(simplified);

      // 🔥 same logic for saved stroke
      const effectiveColor =
        colorRef.current === "#000000" || colorRef.current === "#ffffff"
          ? getDefaultPenColor()
          : colorRef.current;

      const fill = effectiveColor.replace("#", "0x");

      const relativePoints = flattenPoints(simplified, bounds.x, bounds.y);

      await onCreate("path", bounds.x, bounds.y, {
        points: relativePoints,
        fill: `0x${fill.replace("0x", "")}`,
        strokeWidth: strokeWidthRef.current,
        width: bounds.width,
        height: bounds.height,
      });
    };

    viewport.on("pointerdown", onDown);
    viewport.on("pointermove", onMove);
    viewport.on("pointerup", onUp);
    viewport.on("pointerupoutside", onUp);

    return () => {
      viewport.off("pointerdown", onDown);
      viewport.off("pointermove", onMove);
      viewport.off("pointerup", onUp);
      viewport.off("pointerupoutside", onUp);
    };
  }, []);
}