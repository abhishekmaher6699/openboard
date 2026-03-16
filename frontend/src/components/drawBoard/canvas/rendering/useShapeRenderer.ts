import { Container } from "pixi.js"
import { useEffect, useRef } from "react"
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

  // track last rendered version of each object to skip unnecessary redraws
  const renderedRef = useRef<Map<string, string>>(new Map())

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
        renderedRef.current.delete(id)
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
          if (interaction.isEditing) return

          const now = Date.now()
          if (now - lastUpTime < 300) {
            e.stopPropagation()
            lastUpTime = 0
            interaction.activeDrag = null
            interaction.isGroupDrag = false
            viewport.plugins.resume("drag")
            interaction.selected = new Set()
            if (interaction.selectionGraphics) {
              interaction.selectionGraphics.visible = false
            }
            const currentObj = objectMapRef.current.get(obj.id)
            if (currentObj?.type === "sticky" || currentObj?.type === "text") {
              onTextOpen(obj.id)
            }
            return
          }
          lastUpTime = now
        })

        container.on("pointerdown", (e: any) => {
          e.stopPropagation()
          if (interaction.isEditing) return

          const currentObj = objectMapRef.current.get(obj.id)
          if (!currentObj) return

          if (toolRef.current === "text") {
            const currentObj = objectMapRef.current.get(obj.id)
            if (currentObj?.type === "sticky" || currentObj?.type === "text") {
              onTextOpen(obj.id)
            }
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
        // only redraw if something actually changed
        const key = `${obj.x},${obj.y},${obj.width},${obj.height},${JSON.stringify(obj.data)}`
        if (renderedRef.current.get(obj.id) !== key) {
          container.x = obj.x
          container.y = obj.y
          drawShapeFromObj(container, obj)
          renderedRef.current.set(obj.id, key)
        }
      }

      // always keep zIndex in sync
      container.zIndex = obj.z_index ?? 0
    })

    // force pixi to re-sort after all zIndex values are updated
    itemsLayer.sortChildren()
  }, [objects])
}