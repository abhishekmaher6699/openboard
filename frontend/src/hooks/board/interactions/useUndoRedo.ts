import { useEffect } from "react";
import type { UseUndoRedoProps } from "../../../types/canvas";


export function useUndoRedo({ onUndo, onRedo }: UseUndoRedoProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        onUndo();
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        onRedo();
      }

      // Windows redo: Ctrl+Y
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);
}