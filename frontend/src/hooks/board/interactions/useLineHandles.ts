import { Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { BoardObject } from "../../../types/board";
import { drawShapeFromObj } from "../../../lib/shapeUtils";

const HANDLE_RADIUS = 7;

type Props = {
  viewportRef: React.RefObject<any>;
  overlayLayerRef: React.RefObject<any>;
  interactionRef: React.RefObject<any>;
  objectMapRef: React.RefObject<Map<string, BoardObject>>;
  selectedIds: string[];
  objects: BoardObject[];
  onUpdateLine: (
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => void;
  disabled?: boolean;
};

export function useLineHandles({
  viewportRef,
  overlayLayerRef,
  interactionRef,
  objectMapRef,
  selectedIds,
  objects,
  onUpdateLine,
  disabled,
}: Props) {
  const handlesRef = useRef<Graphics[]>([]);
  const draggingRef = useRef<{ id: string; point: "p1" | "p2" } | null>(null);

  const clearHandles = () => {
    const overlay = overlayLayerRef.current;
    handlesRef.current.forEach((h) => {
      overlay?.removeChild(h);
      h.destroy();
    });
    handlesRef.current = [];
  };

  const drawHandles = () => {
    clearHandles();
    if (disabled) return;

    const selectedObjects = selectedIds
      .map((id) => objectMapRef.current.get(id))
      .filter(Boolean);
    const allLines = selectedObjects.every((obj) => obj?.type === "line");
    if (!allLines || selectedIds.length !== 1) return;

    const overlay = overlayLayerRef.current;
    const viewport = viewportRef.current;
    if (!overlay || !viewport) return;

    selectedIds.forEach((id) => {
      const obj = objectMapRef.current.get(id);
      if (!obj || obj.type !== "line") return;

      const g = interactionRef.current.graphicsMap.get(id);
      const baseX = g ? g.x : obj.x;
      const baseY = g ? g.y : obj.y;

      const x1 = baseX + (obj.data?.x1 ?? 0);
      const y1 = baseY + (obj.data?.y1 ?? 0);
      const x2 = baseX + (obj.data?.x2 ?? obj.width ?? 200);
      const y2 = baseY + (obj.data?.y2 ?? 0);

      const makeHandle = (wx: number, wy: number, point: "p1" | "p2") => {
        const h = new Graphics();
        h.circle(0, 0, HANDLE_RADIUS);
        h.fill(0xffffff);
        h.stroke({ width: 2, color: 0x3b82f6 });
        h.x = wx;
        h.y = wy;
        h.eventMode = "static";
        h.cursor = "crosshair";
        h.zIndex = 1000;

        h.on("pointerdown", (e: any) => {
          e.stopPropagation();
          draggingRef.current = { id, point };
          viewport.plugins.pause("drag");
        });

        overlay.addChild(h);
        handlesRef.current.push(h);
      };

      makeHandle(x1, y1, "p1");
      makeHandle(x2, y2, "p2");
    });
  };

  // redraw handles when selection or objects change (but not during endpoint drag)
  useEffect(() => {
    if (draggingRef.current) return;
    drawHandles();
    return () => clearHandles();
  }, [selectedIds, objects, disabled]);

  // endpoint drag
  useEffect(() => {
    if (disabled) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onMove = (e: any) => {
      // handle whole-line drag — keep handles in sync with graphics position
      const interaction = interactionRef.current;
      if (!draggingRef.current && interaction.activeDrag) {
        const dragId = interaction.activeDrag.id;
        const obj = objectMapRef.current.get(dragId);
        if (!obj || obj.type !== "line") return;

        const g = interaction.graphicsMap.get(dragId);
        if (!g) return;

        const x1 = g.x + (obj.data?.x1 ?? 0);
        const y1 = g.y + (obj.data?.y1 ?? 0);
        const x2 = g.x + (obj.data?.x2 ?? obj.width ?? 200);
        const y2 = g.y + (obj.data?.y2 ?? 0);

        const handles = handlesRef.current;
        if (handles[0]) {
          handles[0].x = x1;
          handles[0].y = y1;
        }
        if (handles[1]) {
          handles[1].x = x2;
          handles[1].y = y2;
        }
        return;
      }

      // handle endpoint drag
      const drag = draggingRef.current;
      if (!drag) return;

      const pos = viewport.toWorld(e.global);
      const obj = objectMapRef.current.get(drag.id);
      if (!obj) return;

      let x1 = obj.data?.x1 ?? 0;
      let y1 = obj.data?.y1 ?? 0;
      let x2 = obj.data?.x2 ?? obj.width ?? 200;
      let y2 = obj.data?.y2 ?? 0;

      if (drag.point === "p1") {
        x1 = pos.x - obj.x;
        y1 = pos.y - obj.y;
      } else {
        x2 = pos.x - obj.x;
        y2 = pos.y - obj.y;
      }

      // update handle position
      const handleIdx = drag.point === "p1" ? 0 : 1;
      const h = handlesRef.current[handleIdx];
      if (h) {
        h.x = pos.x;
        h.y = pos.y;
      }

      // update objectMapRef for live redraw
      const updated = { ...obj, data: { ...obj.data, x1, y1, x2, y2 } };
      objectMapRef.current.set(drag.id, updated);

      // redraw line graphics live
      const g = interactionRef.current.graphicsMap.get(drag.id);
      if (g) drawShapeFromObj(g, updated);
    };

    const onUp = () => {
      const drag = draggingRef.current;
      if (!drag) return;

      const obj = objectMapRef.current.get(drag.id);
      if (obj) {
        const x1 = obj.data?.x1 ?? 0;
        const y1 = obj.data?.y1 ?? 0;
        const x2 = obj.data?.x2 ?? obj.width ?? 200;
        const y2 = obj.data?.y2 ?? 0;
        onUpdateLine(drag.id, x1, y1, x2, y2);
      }

      draggingRef.current = null;
      viewport.plugins.resume("drag");
      drawHandles();
    };

    viewport.on("pointermove", onMove);
    viewport.on("pointerup", onUp);
    viewport.on("pointerupoutside", onUp);

    return () => {
      viewport.off("pointermove", onMove);
      viewport.off("pointerup", onUp);
      viewport.off("pointerupoutside", onUp);
    };
  }, [selectedIds, disabled]);

  return { drawHandles, clearHandles };
}
