import { Container } from "pixi.js"
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
  toolRef,
  onTextOpen,
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

    graphicsMap.forEach((container, id) => {
      if (!nextIds.has(id)) {
        itemsLayer.removeChild(container)
        container.destroy({ children: true })
        graphicsMap.delete(id)
      }
    })

    objects.forEach(obj => {
      let container = graphicsMap.get(obj.id)

      if (!container) {
        container = new Container()
        container.eventMode = "static"
        container.cursor = "pointer"

        itemsLayer.addChild(container)
        graphicsMap.set(obj.id, container)

        let lastUpTime = 0

        container.on("pointerup", (e: any) => {
          // ignore if editor is already open
          if (interaction.isEditing) return

          const now = Date.now()
          if (now - lastUpTime < 300) {
            e.stopPropagation()
            lastUpTime = 0
            interaction.activeDrag = null
            interaction.isGroupDrag = false
            viewport.plugins.resume("drag")
            onTextOpen(obj.id)
            return
          }
          lastUpTime = now
        })

        container.on("pointerdown", (e: any) => {
          e.stopPropagation()

          // ignore if editor is open
          if (interaction.isEditing) return

          const currentObj = objectMapRef.current.get(obj.id)
          if (!currentObj) return

          if (toolRef.current === "text") {
            onTextOpen(obj.id)
            return
          }

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
              graphics: container,
              offsetX: pos.x - container!.x,
              offsetY: pos.y - container!.y,
            }
            viewport.plugins.pause("drag")
          }
        })
      }

      const isDragging = interaction.activeDrag?.id === obj.id
      if (!isDragging) {
        container.x = obj.x
        container.y = obj.y
        drawShapeFromObj(container, obj)
        // in useShapeRenderer, after drawShapeFromObj
        container.zIndex = obj.z_index ?? 0
      }

      itemsLayer.sortChildren()
    })
  }, [objects])
}