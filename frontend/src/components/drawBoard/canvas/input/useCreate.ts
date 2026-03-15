import { useEffect, useRef } from "react"
import type { UseCreateProps } from "../../../../types/board"

export function useCreate({
  viewportRef,
  tool,
  onCreate,
}: UseCreateProps) {

  const toolRef = useRef(tool)
  toolRef.current = tool

  const onCreateRef = useRef(onCreate)
  onCreateRef.current = onCreate

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let lastClick = 0

    const down = (e: any) => {
      const now = Date.now()

      if (now - lastClick < 300) {
        const pos = viewport.toWorld(e.global)

        const DEFAULT_W = 200
        const DEFAULT_H = 120

        // Center the shape on the click point
        onCreateRef.current(
          toolRef.current,
          pos.x - DEFAULT_W / 2,
          pos.y - DEFAULT_H / 2,
        )
      }

      lastClick = now
    }

    viewport.on("pointerdown", down)
    return () => viewport.off("pointerdown", down)
  }, [])
}