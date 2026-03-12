import { Container, Graphics } from "pixi.js"
import { useRef, useEffect } from "react"

export function useSelection({overlayLayerRef, viewportRef}: any) {

  const selectedRef = useRef<string | null>(null)
  const selectionRef = useRef<Container | null>(null)

  function drawSelection(obj: any) {

    const overlay = overlayLayerRef.current
    if (!overlay) return

    if (selectionRef.current) {
      overlay.removeChild(selectionRef.current)
    }

    const container = new Container()
    const outline = new Graphics()

    const padding = 4

    outline.rect(
      -padding,
      -padding,
      obj.width + padding * 2,
      obj.height + padding * 2
    )

    outline.stroke({
      width: 2,
      color: 0x3b82f6,
      alpha: 0.8
    })

    container.addChild(outline)

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
        selectionRef.current.destroy()
        selectionRef.current = null
      }

    }

    viewport.on("pointerdown", down)

    return () => viewport.off("pointerdown", down)

  }, [])

  return { selectedRef, selectionRef, drawSelection }

}