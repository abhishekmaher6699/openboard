import { Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import type {
  DrawSelectionFn,
  SelectionOverrides,
  UseSelectionProps,
} from "../../../types/canvas";

type SelectionRect = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function getBoundingBox(
  rects: { x: number; y: number; width: number; height: number }[],
  padding = 0,
) {
  return {
    minX: Math.min(...rects.map((r) => r.x)) - padding,
    minY: Math.min(...rects.map((r) => r.y)) - padding,
    maxX: Math.max(...rects.map((r) => r.x + r.width)) + padding,
    maxY: Math.max(...rects.map((r) => r.y + r.height)) + padding,
  };
}

function isInsideBox(
  pos: { x: number; y: number },
  box: { minX: number; minY: number; maxX: number; maxY: number },
) {
  return (
    pos.x >= box.minX &&
    pos.x <= box.maxX &&
    pos.y >= box.minY &&
    pos.y <= box.maxY
  );
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
  toolRef,
}: UseSelectionProps) {
  const drawSelection: DrawSelectionFn = (
    ids: Set<string>,
    overrides?: SelectionOverrides,
  ) => {
    const overlay = overlayLayerRef.current;
    if (!overlay) return;

    const interaction = interactionRef.current;
    onSelectionChange?.([...ids]);

    if (ids.size === 0) {
      if (interaction.selectionGraphics)
        interaction.selectionGraphics.visible = false;
      onToolbarUpdate?.(new Set(), undefined);
      return;
    }

    const rects: SelectionRect[] = [];
    ids.forEach((id) => {
      const obj = objectMapRef.current.get(id);
      if (!obj) return;

      let pos: { x: number; y: number; width: number; height: number };

      if (obj.type === "line") {
        const override = overrides?.get(id);
        if (override) {
          pos = override; // ← use override if provided (during drag)
        } else {
          const x1 = obj.x + (obj.data?.x1 ?? 0);
          const y1 = obj.y + (obj.data?.y1 ?? 0);
          const x2 = obj.x + (obj.data?.x2 ?? obj.width ?? 200);
          const y2 = obj.y + (obj.data?.y2 ?? 0);
          pos = {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
          };
        }
      } else {
        pos = overrides?.get(id) ?? {
          x: obj.x,
          y: obj.y,
          width: obj.width ?? 200,
          height: obj.height ?? 120,
        };
      }

      rects.push({ id, type: obj.type, ...pos });
    });
    if (rects.length === 0) return;

    const allLines = rects.every((r) => r.type === "line");
    if (allLines) {
      onToolbarUpdate?.(ids, overrides);
      return;
    }

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
        x: 0,
        y: 0,
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

      if (toolRef?.current !== "select") return
      
      if (interaction.isMarqueeActive) return;
      if (interaction.isEditing) return
      if (e.originalEvent?.shiftKey) return;

      if (interaction.selectionGraphics && interaction.selected.size > 0) {
        const pos = viewport.toWorld(e.global);
        const rects = [...interaction.selected]
          .map((id) => {
            const obj = objectMapRef.current.get(id);
            if (!obj) return null;

            if (obj.type === "line") {
              const x1 = obj.x + (obj.data?.x1 ?? 0);
              const y1 = obj.y + (obj.data?.y1 ?? 0);
              const x2 = obj.x + (obj.data?.x2 ?? obj.width ?? 200);
              const y2 = obj.y + (obj.data?.y2 ?? 0);
              return {
                id,
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
              };
            }

            return {
              id,
              x: obj.x,
              y: obj.y,
              width: obj.width ?? 200,
              height: obj.height ?? 120,
            };
          })
          .filter(Boolean) as {
          id: string;
          x: number;
          y: number;
          width: number;
          height: number;
        }[];

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
      if (interaction.selectionGraphics)
        interaction.selectionGraphics.visible = false;
    };

    const up = () => {
      interaction.isGroupDrag = false;
    };

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
