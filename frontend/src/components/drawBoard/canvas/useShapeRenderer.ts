import { Graphics } from "pixi.js"
import { useEffect, useRef } from "react"
import type { UseShapeRendererProps } from "../../../types/board"
import { drawShapeFromObj } from "./shapeUtils"


export function useShapeRenderer({
  objects,
  viewportRef,
  itemsLayerRef,
  selectedRef,
  selectionRef,
  activeDragRef,
  graphicsMapRef,
  drawSelection,
}: UseShapeRendererProps) {

  const objectsRef = useRef(objects)
  objectsRef.current = objects

  const drawSelectionRef = useRef(drawSelection)
  drawSelectionRef.current = drawSelection

  useEffect(() => {
    const viewport = viewportRef.current
    const itemsLayer = itemsLayerRef.current
    const graphicsMap = graphicsMapRef.current

    if (!viewport || !itemsLayer) return

    const nextIds = new Set(objects.map(o => o.id))
    graphicsMap.forEach((g, id) => {
      if (!nextIds.has(id)) {
        itemsLayer.removeChild(g)
        g.destroy()
        graphicsMap.delete(id)
      }
    })

    objects.forEach(obj => {
      let g = graphicsMap.get(obj.id)

      if (!g) {
        g = new Graphics()
        g.eventMode = "static"
        g.cursor = "pointer"

        itemsLayer.addChild(g)
        graphicsMap.set(obj.id, g)

        g.on("pointerdown", (e: any) => {
          e.stopPropagation()

          const currentObj = objectsRef.current.find(o => o.id === obj.id)
          if (!currentObj) return

          selectedRef.current = obj.id

          drawSelectionRef.current({
            ...currentObj,
            x: g!.x,
            y: g!.y,
          })

          const pos = viewport.toWorld(e.global)

          activeDragRef.current = {
            id: obj.id,
            graphics: g,
            offsetX: pos.x - g!.x,
            offsetY: pos.y - g!.y,
          }

          viewport.plugins.pause("drag")
        })
      }

      const isDragging = activeDragRef.current?.id === obj.id
      if (!isDragging) {
        g.x = obj.x
        g.y = obj.y
        drawShapeFromObj(g, obj)
      }

      if (selectedRef.current === obj.id && selectionRef.current) {
        selectionRef.current.x = obj.x
        selectionRef.current.y = obj.y
      }
    })
  }, [objects])
}