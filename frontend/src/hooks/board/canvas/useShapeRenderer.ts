import { Container } from "pixi.js"
import { useEffect, useRef } from "react"
import type { BoardObject } from "../../../types/board"
import type { UseShapeRendererProps } from "../../../types/canvas"
import { drawShapeFromObj } from "../../../lib/shapeUtils"

const getObjectKey = (obj: BoardObject) =>
  `${obj.x},${obj.y},${obj.width},${obj.height},${JSON.stringify(obj.data)}`

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
  onTextCreate,
  disabled,
}: UseShapeRendererProps) {
  const interaction = interactionRef.current
  const renderedRef = useRef<Map<string, string>>(new Map())
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useEffect(() => {
    objectsRef.current = objects
    objectMapRef.current = new Map(objects.map(o => [o.id, o]))
  }, [objects])

  useEffect(() => {
    const viewport = viewportRef.current
    const itemsLayer = itemsLayerRef.current
    const graphicsMap = interaction.graphicsMap

    if (!viewport || !itemsLayer) return

    // remove deleted objects
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

        const { onPointerUp, onPointerDown } = createPointerHandlers(
          obj, container, interaction, viewport,
          objectMapRef, drawSelectionRef, toolRef,
          onTextOpen, onTextCreate, disabledRef
        )

        container.on("pointerup", onPointerUp)
        container.on("pointerdown", onPointerDown)
      }

      const isDragging = interaction.activeDrag?.id === obj.id
      if (!isDragging) {
        const key = getObjectKey(obj)
        if (renderedRef.current.get(obj.id) !== key) {
          container.x = obj.x
          container.y = obj.y
          drawShapeFromObj(container, obj)
          renderedRef.current.set(obj.id, key)
        }
      }

      container.zIndex = obj.z_index ?? 0
    })

    itemsLayer.sortChildren()
  }, [objects])
}




function createPointerHandlers(
  obj: BoardObject,
  container: Container,
  interaction: any,
  viewport: any,
  objectMapRef: React.RefObject<Map<string, BoardObject>>,
  drawSelectionRef: React.RefObject<any>,
  toolRef: React.RefObject<any>,
  onTextOpen: (id: string) => void,
  onTextCreate: (x: number, y: number) => void,  // ← add this
  disabledRef: React.RefObject<boolean | undefined>,
) {
  let lastUpTime = 0

  const onPointerUp = (e: any) => {
    if (interaction.isEditing || disabledRef.current) return

    const now = Date.now()
    if (now - lastUpTime < 300) {
      e.stopPropagation()
      lastUpTime = 0
      interaction.activeDrag = null
      interaction.isGroupDrag = false
      viewport.plugins.resume("drag")
      interaction.selected = new Set()
      if (interaction.selectionGraphics) interaction.selectionGraphics.visible = false

      const currentObj = objectMapRef.current.get(obj.id)
      if (!currentObj) return

      // ← FIX: text and sticky both open the editor on THIS object
      if (currentObj.type === "text" || currentObj.type === "sticky") {
        onTextOpen(currentObj.id)
      }
      // all other types (rectangle, circle, etc.) do nothing on double-tap
      return

    }
    lastUpTime = now
  }

  const onPointerDown = (e: any) => {
    e.stopPropagation()
    if (interaction.isEditing || disabledRef.current) return

    const currentObj = objectMapRef.current.get(obj.id)
    if (!currentObj) return

    if (toolRef.current === "text") {
      if (currentObj.type === "sticky" || currentObj.type === "text") onTextOpen(obj.id)
      return
    }

    const shiftHeld = e.originalEvent?.shiftKey ?? false
    const alreadySelected = interaction.selected.has(obj.id)

    if (shiftHeld) {
      const next = new Set(interaction.selected)
      alreadySelected ? next.delete(obj.id) : next.add(obj.id)
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
        offsetX: pos.x - container.x,
        offsetY: pos.y - container.y,
      }
      viewport.plugins.pause("drag")
    }
  }

  return { onPointerUp, onPointerDown }
}