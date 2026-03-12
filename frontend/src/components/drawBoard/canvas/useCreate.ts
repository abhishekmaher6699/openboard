import { useEffect, useRef } from "react"

export function useCreate({
  viewportRef,
  tool,
  onCreate
}: any) {

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
        onCreateRef.current(toolRef.current, pos.x, pos.y)
      }

      lastClick = now
    }

    viewport.on("pointerdown", down)
    return () => viewport.off("pointerdown", down)

  }, []) // ← empty deps, registered once, refs stay current
}