import { useState, useCallback } from "react"
import type { BoardObject } from "../types/board"

export function useActivityPreview() {
  const [preview, setPreview] = useState<{
    active: boolean;
    objects: BoardObject[];
    label: string;
  }>({ active: false, objects: [], label: "" });

const enterPreview = useCallback((snapshot: BoardObject[], label: string) => {
  // console.log("enterPreview called", { snapshot_len: snapshot.length, label });
  setPreview({ active: true, objects: snapshot, label });
}, []);

  const exitPreview = useCallback(() => {
    setPreview({ active: false, objects: [], label: "" });
  }, []);

  return {
    isPreviewMode: preview.active,
    previewObjects: preview.objects,
    previewLabel: preview.label,
    enterPreview,
    exitPreview,
  };
}