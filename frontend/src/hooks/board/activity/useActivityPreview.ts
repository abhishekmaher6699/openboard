import { useState, useCallback } from "react";
import type { BoardObject } from "../../../types/board";

export function useActivityPreview() {
  const [preview, setPreview] = useState<{
    active: boolean;
    objects: BoardObject[];
    label: string;
  }>({ active: false, objects: [], label: "" });

  const [previewSequence, setPreviewSequence] = useState<number>(0);

  const enterPreview = useCallback((snapshot: BoardObject[], label: string, sequence: number) => {
    setPreview({ active: true, objects: snapshot, label });
    setPreviewSequence(sequence);
  }, []);

  const exitPreview = useCallback(() => {
    setPreview({ active: false, objects: [], label: "" });
    setPreviewSequence(0);
  }, []);

  return {
    isPreviewMode: preview.active,
    previewObjects: preview.objects,
    previewLabel: preview.label,
    previewSequence,
    enterPreview,
    exitPreview,
  };
}