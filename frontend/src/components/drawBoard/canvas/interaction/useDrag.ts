import { useEffect } from "react";
import type { SelectionOverrides, UseDragProps } from "../../../../types/board";

export function useDrag({
  viewportRef,
  interactionRef,
  objectMapRef,
  onMove,
  onManyMove,
  drawSelectionRef,
  disabled
}: UseDragProps) {
  const interaction = interactionRef.current;

  useEffect(() => {

    if (disabled) return 
    const viewport = viewportRef.current;
    if (!viewport) return;

    const move = (e: any) => {
      const drag = interaction.activeDrag;
      if (!drag) return;

      const pos = viewport.toWorld(e.global);
      const newX = pos.x - drag.offsetX;
      const newY = pos.y - drag.offsetY;

      const dx = newX - drag.graphics.x;
      const dy = newY - drag.graphics.y;

      // Move all selected shapes by the same delta
      interaction.selected.forEach((id: string) => {
        const g = interaction.graphicsMap.get(id);
        if (!g) return;
        g.x += dx;
        g.y += dy;
      });

      // Build overrides from live Pixi positions
      const overrides: SelectionOverrides = new Map();
      interaction.selected.forEach((id: string) => {
        const g = interaction.graphicsMap.get(id);
        const obj = objectMapRef.current.get(id);
        if (!g || !obj) return;
        overrides.set(id, {
          x: g.x,
          y: g.y,
          width: obj.width ?? 200,
          height: obj.height ?? 120,
        });
      });

      drawSelectionRef.current(interaction.selected, overrides);
    };

    const up = () => {
      const drag = interaction.activeDrag;
      if (!drag) return;

      if (interaction.selected.size === 1) {
        const id = [...interaction.selected][0];
        const g = interaction.graphicsMap.get(id);
        const obj = objectMapRef.current.get(id);
        if (
          g &&
          obj &&
          (Math.abs(g.x - obj.x) > 1 || Math.abs(g.y - obj.y) > 1)
        ) {
          onMove(id, g.x, g.y);
        }
      } else {
        const moves: { id: string; x: number; y: number }[] = [];
        interaction.selected.forEach((id: string) => {
          const g = interaction.graphicsMap.get(id);
          const obj = objectMapRef.current.get(id);
          if (!g || !obj) return;
          if (Math.abs(g.x - obj.x) > 1 || Math.abs(g.y - obj.y) > 1) {
            moves.push({ id, x: g.x, y: g.y });
          }
        });
        if (moves.length > 0) onManyMove(moves);
      }

      interaction.activeDrag = null;
      viewport.plugins.resume("drag");
    };

    viewport.on("pointermove", move);
    viewport.on("pointerup", up);
    viewport.on("pointerupoutside", up);

    return () => {
      viewport.off("pointermove", move);
      viewport.off("pointerup", up);
      viewport.off("pointerupoutside", up);
    };
  }, [onMove]);

  return { interactionRef };
}
