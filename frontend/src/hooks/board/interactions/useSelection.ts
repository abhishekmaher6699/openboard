import { Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import type { DrawSelectionFn, SelectionOverrides, UseSelectionProps } from "../../../types/canvas";

type SelectionRect = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function getBoundingBox(rects: { x: number; y: number; width: number; height: number }[], padding = 0) {
  return {
    minX: Math.min(...rects.map(r => r.x)) - padding,
    minY: Math.min(...rects.map(r => r.y)) - padding,
    maxX: Math.max(...rects.map(r => r.x + r.width)) + padding,
    maxY: Math.max(...rects.map(r => r.y + r.height)) + padding,
  }
}

function isInsideBox(
  pos: { x: number; y: number },
  box: { minX: number; minY: number; maxX: number; maxY: number }
) {
  return pos.x >= box.minX && pos.x <= box.maxX && pos.y >= box.minY && pos.y <= box.maxY
}

export function useSelection({
  overlayLayerRef,
  viewportRef,
  interactionRef,
  objectMapRef,
  attachHandles,
  onSelectionChange,
  onToolbarUpdate,
  disabled,
}: UseSelectionProps) {

  const drawSelection: DrawSelectionFn = (ids: Set<string>, overrides?: SelectionOverrides) => {
    const overlay = overlayLayerRef.current;
    if (!overlay) return;

    const interaction = interactionRef.current;
    onSelectionChange?.([...ids]);

    if (ids.size === 0) {
      if (interaction.selectionGraphics) interaction.selectionGraphics.visible = false;
      onToolbarUpdate?.(new Set(), undefined);
      return;
    }

    const rects: SelectionRect[] = [];
    ids.forEach((id) => {
      const obj = objectMapRef.current.get(id);
      if (!obj) return;
      const pos = overrides?.get(id) ?? {
        x: obj.x, y: obj.y,
        width: obj.width ?? 200,
        height: obj.height ?? 120,
      };
      rects.push({ id, type: obj.type, ...pos });
    });

    if (rects.length === 0) return;

    const padding = 4;
    const { minX, minY, maxX, maxY } = getBoundingBox(rects, 0);
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    let container = interaction.selectionGraphics;
    if (!container) {
      container = new Container();
      container.eventMode = "static";
      container.cursor = "grab";
      overlay.addChild(container);
      interaction.selectionGraphics = container;
    }
    container.visible = true;

    let outline = interaction.selectionOutline;
    if (!outline) {
      outline = new Graphics();
      interaction.selectionOutline = outline;
    }

    outline.clear();
    outline.rect(-padding, -padding, width, height);
    outline.stroke({ width: 2, color: 0x3b82f6, alpha: 0.8 });

    container.removeChildren();
    container.addChild(outline);

    if (attachHandles) {
      attachHandles(container, {
        id: rects[0].id,
        type: rects[0].type,
        x: 0, y: 0,
        width: maxX - minX,
        height: maxY - minY,
      });
    }

    container.x = minX;
    container.y = minY;
    onToolbarUpdate?.(ids, overrides);
  };

  useEffect(() => {
    if (disabled) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const interaction = interactionRef.current;

    const down = (e: any) => {
      if (interaction.isMarqueeActive) return;
      if (e.originalEvent?.shiftKey) return;

      if (interaction.selectionGraphics && interaction.selected.size > 0) {
        const pos = viewport.toWorld(e.global);
        const rects = [...interaction.selected]
          .map(id => {
            const obj = objectMapRef.current.get(id);
            if (!obj) return null;
            return { id, x: obj.x, y: obj.y, width: obj.width ?? 200, height: obj.height ?? 120 };
          })
          .filter(Boolean) as { id: string; x: number; y: number; width: number; height: number }[];

        if (rects.length > 0) {
          const box = getBoundingBox(rects, 4);
          if (isInsideBox(pos, box)) {
            const firstRect = rects[0];
            const g = interaction.graphicsMap.get(firstRect.id);
            if (g) {
              interaction.activeDrag = {
                id: firstRect.id,
                graphics: g,
                offsetX: pos.x - g.x,
                offsetY: pos.y - g.y,
              };
              interaction.isGroupDrag = true;
              viewport.plugins.pause("drag");
            }
            return;
          }
        }
      }

      interaction.selected = new Set();
      onSelectionChange?.([]);
      onToolbarUpdate?.(new Set(), undefined);
      if (interaction.selectionGraphics) interaction.selectionGraphics.visible = false;
    };

    const up = () => { interaction.isGroupDrag = false; };

    viewport.on("pointerdown", down);
    viewport.on("pointerup", up);
    viewport.on("pointeroutside", up);

    return () => {
      viewport.off("pointerdown", down);
      viewport.off("pointerup", up);
      viewport.off("pointeroutside", up);
    };
  }, []);

  return { drawSelection };
}