import { useEffect, useRef } from "react"
import type { UseCreateProps } from "../../../../types/board"

const SHAPE_TOOLS = ["rectangle", "circle", "triangle", "diamond", "sticky"]

export function useCreate({
  viewportRef,
  tool,
  onCreate,
  onToolChange,
  onTextCreate,
  interactionRef,
}: UseCreateProps) {

  const toolRef = useRef(tool)
  toolRef.current = tool

  const onCreateRef = useRef(onCreate)
  onCreateRef.current = onCreate

  const onTextCreateRef = useRef(onTextCreate)
  onTextCreateRef.current = onTextCreate

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const interaction = interactionRef?.current
    let lastUpTime = 0

    const up = (e: any) => {
      // ignore if editor is open
      if (interaction?.isEditing) return

      if (e.target !== viewport) return

      const now = Date.now()
      const currentTool = toolRef.current

      if (now - lastUpTime < 300 && currentTool === "select") {
        lastUpTime = 0
        const pos = viewport.toWorld(e.global)
        onTextCreateRef.current?.(pos.x - 100, pos.y - 40)
        return
      }

      lastUpTime = now
    }

    const down = (e: any) => {
      // ignore if editor is open
      if (interaction?.isEditing) return

      const currentTool = toolRef.current

      if (currentTool === "text") {
        e.stopPropagation()
        const pos = viewport.toWorld(e.global)
        onTextCreateRef.current?.(pos.x - 100, pos.y - 40)
        return
      }

      if (!SHAPE_TOOLS.includes(currentTool)) return

      const pos = viewport.toWorld(e.global)
      onCreateRef.current(currentTool, pos.x - 100, pos.y - 60)
      onToolChange?.("select")
    }

    viewport.on("pointerdown", down)
    viewport.on("pointerup", up)

    return () => {
      viewport.off("pointerdown", down)
      viewport.off("pointerup", up)
    }
  }, [])
}