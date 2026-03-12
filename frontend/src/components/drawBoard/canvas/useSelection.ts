import { Container, Graphics } from "pixi.js"
import { useEffect } from "react"
import type { BoardObject } from "../../../types/board"

export function useSelection({
  overlayLayerRef,
  viewportRef,
  selectedRef,
  selectionRef,
  attachHandles,
}: {
  overlayLayerRef: React.RefObject<any>
  viewportRef: React.RefObject<any>
  selectedRef: React.RefObject<string | null>
  selectionRef: React.RefObject<any>
  attachHandles?: (container: any, obj: BoardObject) => void
}) {

  function drawSelection(obj: BoardObject) {
    const overlay = overlayLayerRef.current
    if (!overlay) return

    if (selectionRef.current) {
      overlay.removeChild(selectionRef.current)
      selectionRef.current.destroy({ children: true })
    }

    const container = new Container()
    const outline = new Graphics()
    const padding = 4

    outline.rect(
      -padding,
      -padding,
      (obj.width?? 200) + padding * 2,
      (obj.height?? 120) + padding * 2
    )
    outline.stroke({ width: 2, color: 0x3b82f6, alpha: 0.8 })

    container.addChild(outline)

    if (attachHandles) {
      attachHandles(container, obj)
    }

    container.x = obj.x
    container.y = obj.y

    overlay.addChild(container)
    selectionRef.current = container
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const down = () => {
      selectedRef.current = null
      if (selectionRef.current) {
        selectionRef.current.destroy({ children: true })
        selectionRef.current = null
      }
    }

    viewport.on("pointerdown", down)
    return () => viewport.off("pointerdown", down)
  }, [])

  return { drawSelection }
}