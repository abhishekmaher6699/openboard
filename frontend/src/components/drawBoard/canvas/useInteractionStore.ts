import { useRef } from "react"
import type { BoardInteraction } from "../../../types/board"


export function useBoardInteraction() {
  return useRef<BoardInteraction>({
    selected: new Set<string>(),
    activeDrag: null as any,
    activeResize: null as any,
    graphicsMap: new Map<string, any>(),
    selectionGraphics: null as any,
    selectionOutline: null as any,
    isMarqueeActive: false,
    isGroupDrag: false,
    isEditing: false,
  })
}