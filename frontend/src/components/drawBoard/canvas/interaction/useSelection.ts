import { Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import type {
  DrawSelectionFn,
  SelectionOverrides,
  UseSelectionProps,
} from "../../../../types/board";

export function useSelection({
  overlayLayerRef,
  viewportRef,
  interactionRef,
  objectMapRef,
  attachHandles,
  onSelectionChange,
  onToolbarUpdate,
  disabled
}: UseSelectionProps) {

  const drawSelection: DrawSelectionFn = (
    ids: Set<string>,
    overrides?: SelectionOverrides,
  ) => {
    const overlay = overlayLayerRef.current;
    if (!overlay) return;

    const interaction = interactionRef.current;

    onSelectionChange?.([...ids])

    if (ids.size === 0) {
      if (interaction.selectionGraphics) {
        interaction.selectionGraphics.visible = false;
      }
      onToolbarUpdate?.(new Set(), undefined)
      return;
    }

    const rects: {
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];

    ids.forEach((id) => {
      const obj = objectMapRef.current.get(id);
      if (!obj) return;

      const pos = overrides?.get(id) ?? {
        x: obj.x,
        y: obj.y,
        width: obj.width ?? 200,
        height: obj.height ?? 120,
      };

      rects.push({
        id,
        type: obj.type,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
      });
    });

    if (rects.length === 0) return;

    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.width));
    const maxY = Math.max(...rects.map((r) => r.y + r.height));

    const padding = 4;
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
      container.addChild(outline);
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

    // update toolbar position and selection info
    onToolbarUpdate?.(ids, overrides)
  };

  useEffect(() => {

    if (disabled) return 
    
    const viewport = viewportRef.current;
    if (!viewport) return;

    const interaction = interactionRef.current;

    const down = (e: any) => {
      if (interaction.isMarqueeActive) return;
      const shiftHeld = e.originalEvent?.shiftKey ?? false;
      if (shiftHeld) return;

      if (interaction.selectionGraphics && interaction.selected.size > 0) {
        const pos = viewport.toWorld(e.global);
        const padding = 4;

        const rects = [...interaction.selected]
          .map((id) => {
            const obj = objectMapRef.current.get(id);
            if (!obj) return null;
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
          const minX = Math.min(...rects.map((r) => r.x)) - padding;
          const minY = Math.min(...rects.map((r) => r.y)) - padding;
          const maxX = Math.max(...rects.map((r) => r.x + r.width)) + padding;
          const maxY = Math.max(...rects.map((r) => r.y + r.height)) + padding;

          if (
            pos.x >= minX &&
            pos.x <= maxX &&
            pos.y >= minY &&
            pos.y <= maxY
          ) {
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
      onToolbarUpdate?.(new Set(), undefined)

      if (interaction.selectionGraphics) {
        interaction.selectionGraphics.visible = false;
      }
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