import { useEffect } from "react";
import type { UseDeleteProps } from "../../../../types/board";


export function useDelete({
  interactionRef,
  onDelete,
  onManyDelete,
}: UseDeleteProps) {

  const interaction = interactionRef.current
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (interaction.selected.size === 0) return;

      const ids = [...interaction.selected];

      if (ids.length === 1) {
        onDelete(ids[0]);
      } else {
        onManyDelete(ids);
      }

      interaction.selected = new Set();

      if (interaction.selectionGraphics) {
        interaction.selectionGraphics.visible = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete]);
}
