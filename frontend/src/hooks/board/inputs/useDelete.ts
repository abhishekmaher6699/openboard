import { useEffect } from "react";
import type { UseDeleteProps } from "../../../types/canvas";

export function useDelete({
  interactionRef,
  onDelete,
  onManyDelete,
  disabled,
  clearSelectionRef,
  hideToolbar,
}: UseDeleteProps) {

  const interaction = interactionRef.current

  useEffect(() => {
    if (disabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (interaction.selected.size === 0) return;

      // ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return;

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
      clearSelectionRef?.current?.()
      hideToolbar?.()
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete]);
}