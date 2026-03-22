import { Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type {
  ActiveResize,
  ResizeHandle,
  SelectionOverrides,
  UseResizeProps,
} from "../../../types/canvas";
import { drawShapeFromObj } from "../../../lib/shapeUtils";

const HANDLE_SIZE = 10;
const MIN_SIZE = 40;

const CURSOR_MAP: Record<ResizeHandle, string> = {
  nw: "nw-resize",
  ne: "ne-resize",
  se: "se-resize",
  sw: "sw-resize",
};

function getCursor(handle: ResizeHandle) {
  return CURSOR_MAP[handle];
}

function applyAspectConstraint(type: string, w: number, h: number): { w: number; h: number } {
  if (type === "sticky") return { w, h: w };
  return { w, h };
}

function computeScale(r: ActiveResize, worldPos: { x: number; y: number }) {
  const dx = worldPos.x - r.startX;
  const dy = worldPos.y - r.startY;

  let newGW = r.groupWidth;
  let newGH = r.groupHeight;
  let newGX = r.groupX;
  let newGY = r.groupY;

  if (r.handle === "nw" || r.handle === "sw") {
    newGW = Math.max(MIN_SIZE, r.groupWidth - dx);
    newGX = r.groupX + (r.groupWidth - newGW);
  } else {
    newGW = Math.max(MIN_SIZE, r.groupWidth + dx);
  }

  if (r.handle === "nw" || r.handle === "ne") {
    newGH = Math.max(MIN_SIZE, r.groupHeight - dy);
    newGY = r.groupY + (r.groupHeight - newGH);
  } else {
    newGH = Math.max(MIN_SIZE, r.groupHeight + dy);
  }

  return {
    newGX,
    newGY,
    scaleX: newGW / r.groupWidth,
    scaleY: newGH / r.groupHeight,
  };
}

function computeResizes(r: ActiveResize, worldPos: { x: number; y: number }) {
  const { newGX, newGY, scaleX, scaleY } = computeScale(r, worldPos);
  const overrides: SelectionOverrides = new Map();
  const resizes: { id: string; width: number; height: number; x: number; y: number }[] = [];

  r.objectSnapshots.forEach(({ obj, graphics }, id) => {
    const newX = newGX + (obj.x - r.groupX) * scaleX;
    const newY = newGY + (obj.y - r.groupY) * scaleY;

    if (obj.type === "line") {
      const x1 = (obj.data?.x1 ?? 0) * scaleX;
      const y1 = (obj.data?.y1 ?? 0) * scaleY;
      const x2 = (obj.data?.x2 ?? obj.width ?? 200) * scaleX;
      const y2 = (obj.data?.y2 ?? 0) * scaleY;

      const updatedObj = {
        ...obj,
        x: newX,
        y: newY,
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        data: { ...obj.data, x1, y1, x2, y2 },
      };

      if (graphics) {
        graphics.x = newX;
        graphics.y = newY;
        graphics.scale.set(1, 1);
        drawShapeFromObj(graphics, updatedObj);
      }

      overrides.set(id, {
        x: newX + Math.min(x1, x2),
        y: newY + Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      });

      resizes.push({ id, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), x: newX, y: newY });
      return;
    }

    const { w: newW, h: newH } = applyAspectConstraint(
      obj.type,
      Math.max(MIN_SIZE, obj.width * scaleX),
      Math.max(MIN_SIZE, obj.height * scaleY),
    );

    overrides.set(id, { x: newX, y: newY, width: newW, height: newH });
    resizes.push({ id, width: newW, height: newH, x: newX, y: newY });

    if (graphics) {
      graphics.x = newX;
      graphics.y = newY;
      graphics.scale.set(newW / obj.width, newH / obj.height);
    }
  });

  return { overrides, resizes };
}

export function useResize({
  viewportRef,
  interactionRef,
  objectMapRef,
  onResize,
  onResizeMany,
  drawSelectionRef,
  disabled,
}: UseResizeProps) {
  const activeResizeRef = useRef<ActiveResize | null>(null);

  function attachHandles(
    container: any,
    groupRect: { x: number; y: number; width: number; height: number; type: string },
  ) {
    if (groupRect.type === "line") return;

    const padding = 4;
    const handles: ResizeHandle[] = ["nw", "ne", "se", "sw"];

    handles.forEach((handle) => {
      const h = new Graphics();
      h.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      h.fill(0xffffff);
      h.stroke({ width: 2, color: 0x3b82f6 });
      h.eventMode = "static";
      h.cursor = getCursor(handle);

      h.x = handle.includes("e") ? groupRect.width + padding : -padding;
      h.y = handle.includes("s") ? groupRect.height + padding : -padding;

      h.on("pointerdown", (e: any) => {
        e.stopPropagation();
        const viewport = viewportRef.current;
        if (!viewport) return;

        const interaction = interactionRef.current;
        const worldPos = viewport.toWorld(e.global);
        const objectSnapshots: ActiveResize["objectSnapshots"] = new Map();

        interaction.selected.forEach((id: string) => {
          const obj = objectMapRef.current.get(id);
          const g = interaction.graphicsMap?.get(id);
          if (!obj || !g) return;
          objectSnapshots.set(id, { obj: { ...obj }, graphics: g });
        });

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objectSnapshots.forEach(({ obj }) => {
          if (obj.type === "line") {
            const x1 = obj.x + (obj.data?.x1 ?? 0);
            const y1 = obj.y + (obj.data?.y1 ?? 0);
            const x2 = obj.x + (obj.data?.x2 ?? obj.width ?? 200);
            const y2 = obj.y + (obj.data?.y2 ?? 0);
            minX = Math.min(minX, Math.min(x1, x2));
            minY = Math.min(minY, Math.min(y1, y2));
            maxX = Math.max(maxX, Math.max(x1, x2));
            maxY = Math.max(maxY, Math.max(y1, y2));
          } else {
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + obj.width);
            maxY = Math.max(maxY, obj.y + obj.height);
          }
        });

        activeResizeRef.current = {
          handle,
          startX: worldPos.x,
          startY: worldPos.y,
          groupX: minX,
          groupY: minY,
          groupWidth: maxX - minX,
          groupHeight: maxY - minY,
          objectSnapshots,
        };

        viewport.plugins.pause("drag");
      });

      container.addChild(h);
    });
  }

  useEffect(() => {
    if (disabled) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const interaction = interactionRef.current;

    const onMove = (e: any) => {
      const r = activeResizeRef.current;
      if (!r) return;
      const pos = viewport.toWorld(e.global);
      const { overrides } = computeResizes(r, pos);
      drawSelectionRef.current(interaction.selected, overrides);
    };

    const onUp = (e: any) => {
      const r = activeResizeRef.current;
      if (!r) return;

      const pos = viewport.toWorld(e.global);
      const { resizes } = computeResizes(r, pos);

      resizes.forEach(({ id, width, height, x, y }) => {
        const { obj, graphics } = r.objectSnapshots.get(id)!;
        if (graphics) {
          graphics.scale.set(1, 1);
          if (obj.type === "line") {
            const scaleX = width / (obj.width || 1);
            const scaleY = height / (obj.height || 1);
            drawShapeFromObj(graphics, {
              ...obj, x, y, width, height,
              data: {
                ...obj.data,
                x1: (obj.data?.x1 ?? 0) * scaleX,
                y1: (obj.data?.y1 ?? 0) * scaleY,
                x2: (obj.data?.x2 ?? obj.width) * scaleX,
                y2: (obj.data?.y2 ?? 0) * scaleY,
              }
            });
          } else {
            drawShapeFromObj(graphics, { ...obj, x, y, width, height });
          }
        }
      });

      if (resizes.length === 1) {
        const { id, width, height, x, y } = resizes[0];
        onResize(id, width, height, x, y);
      } else if (resizes.length > 1) {
        onResizeMany(resizes);
      }

      activeResizeRef.current = null;
      viewport.plugins.resume("drag");
    };

    viewport.on("pointermove", onMove);
    viewport.on("pointerup", onUp);
    viewport.on("pointerupoutside", onUp);

    return () => {
      viewport.off("pointermove", onMove);
      viewport.off("pointerup", onUp);
      viewport.off("pointerupoutside", onUp);
    };
  }, [onResize]);

  return { activeResizeRef, attachHandles };
}