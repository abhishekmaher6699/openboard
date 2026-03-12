import { useEffect, useRef } from "react"

export function useDrag({
  viewportRef,
  selectedRef,
  selectionRef,
  onMove,
}: any) {

  const activeDragRef = useRef<any>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const move = (e: any) => {
      const drag = activeDragRef.current
      if (!drag) return

      const pos = viewport.toWorld(e.global)

      drag.graphics.x = pos.x - drag.offsetX
      drag.graphics.y = pos.y - drag.offsetY

      if (selectedRef.current === drag.id && selectionRef.current) {
        selectionRef.current.x = drag.graphics.x
        selectionRef.current.y = drag.graphics.y
      }
    }

    const up = (e: any) => {
      const drag = activeDragRef.current
      if (!drag) return

      const pos = viewport.toWorld(e.global)

      onMove(drag.id, pos.x - drag.offsetX, pos.y - drag.offsetY)

      activeDragRef.current = null
      viewport.plugins.resume("drag")
    }

    viewport.on("pointermove", move)
    viewport.on("pointerup", up)
    viewport.on("pointerupoutside", up)

    return () => {
      viewport.off("pointermove", move)
      viewport.off("pointerup", up)
      viewport.off("pointerupoutside", up)
    }
  }, [onMove])

  return { activeDragRef }
}