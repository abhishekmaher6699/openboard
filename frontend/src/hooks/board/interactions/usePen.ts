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
      // only add point if moved enough to matter
      if (Math.hypot(pos.x - last[0], pos.y - last[1]) < 2) return;
      rawPoints.push([pos.x, pos.y]);

      if (!previewGraphics) return;
      previewGraphics.clear();
      const strokeColor = Number(colorRef.current.replace("#", "0x"));
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

      // remove preview
      if (previewGraphics) {
        itemsLayer.removeChild(previewGraphics);
        previewGraphics.destroy();
        previewGraphics = null;
      }

      if (rawPoints.length < 2) return;

      // simplify path
      const simplified = simplifyPoints(rawPoints, 2);
      if (simplified.length < 2) return;

      // compute bounding box — object position is top-left of bounds
      const bounds = getBounds(simplified);
      const fill = colorRef.current.replace("#", "0x");

      // store points relative to object origin
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