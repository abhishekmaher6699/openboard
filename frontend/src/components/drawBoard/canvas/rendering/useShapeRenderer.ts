import { Graphics } from "pixi.js"
import { useEffect } from "react"
import type { UseShapeRendererProps } from "../../../../types/board"
import { drawShapeFromObj } from "./../interaction/shapeUtils"

export function useShapeRenderer({
  objects,
  viewportRef,
  itemsLayerRef,
  interactionRef,
  objectsRef,
  objectMapRef,
  drawSelectionRef,
}: UseShapeRendererProps) {


  const interaction = interactionRef.current

  useEffect(() => {
      objectsRef.current = objects
      objectMapRef.current = new Map(objects.map(o => [o.id, o]))
    }, [objects])

  useEffect(() => {
    const viewport = viewportRef.current
    const itemsLayer = itemsLayerRef.current
    const graphicsMap = interaction.graphicsMap

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

          const currentObj = objectMapRef.current.get(obj.id)
          if (!currentObj) return

          const shiftHeld = e.originalEvent?.shiftKey ?? false
          const alreadySelected = interaction.selected.has(obj.id)

          if (shiftHeld) {
            const next = new Set(interaction.selected)
            if (alreadySelected) {
              next.delete(obj.id)
            } else {
              next.add(obj.id)
            }
            interaction.selected = next
          } else if (!alreadySelected) {
            interaction.selected = new Set([obj.id])
          }

          drawSelectionRef.current(interaction.selected)

          if (!shiftHeld) {
            const pos = viewport.toWorld(e.global)
            interaction.activeDrag = {
              id: obj.id,
              graphics: g,
              offsetX: pos.x - g!.x,
              offsetY: pos.y - g!.y,
            }
            viewport.plugins.pause("drag")
          }
        })
      }

      const isDragging = interaction.activeDrag?.id === obj.id
      if (!isDragging) {
        g.x = obj.x
        g.y = obj.y
        drawShapeFromObj(g, obj)
      }
    })
  }, [objects])
}