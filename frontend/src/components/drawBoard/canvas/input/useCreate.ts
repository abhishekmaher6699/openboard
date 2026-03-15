import { useEffect, useRef } from "react"
import type { UseCreateProps } from "../../../../types/board"

const SHAPE_TOOLS = ["rectangle", "circle", "triangle", "diamond", "sticky"]

export function useCreate({
  viewportRef,
  tool,
  onCreate,
  onToolChange,
}: UseCreateProps) {

  const toolRef = useRef(tool)
  toolRef.current = tool

  const onCreateRef = useRef(onCreate)
  onCreateRef.current = onCreate

  const onToolChangeRef = useRef(onToolChange)
  onToolChangeRef.current = onToolChange

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const down = (e: any) => {
      // only create when a shape tool is active, not on plain select/drag clicks
      if (!SHAPE_TOOLS.includes(toolRef.current)) return

      const pos = viewport.toWorld(e.global)

      const DEFAULT_W = 200
      const DEFAULT_H = 120

      onCreateRef.current(
        toolRef.current,
        pos.x - DEFAULT_W / 2,
        pos.y - DEFAULT_H / 2,
      )

      // switch back to select after placing a shape
      onToolChangeRef.current?.("select")
    }

    viewport.on("pointerdown", down)
    return () => viewport.off("pointerdown", down)
  }, [])
}