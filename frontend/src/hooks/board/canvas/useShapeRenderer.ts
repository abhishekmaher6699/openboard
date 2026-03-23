import { Container } from "pixi.js"
import { useEffect, useRef } from "react"
import type { BoardObject } from "../../../types/board"
import type { UseShapeRendererProps } from "../../../types/canvas"
import { drawShapeFromObj } from "../../../lib/shapeUtils"

const getObjectKey = (obj: BoardObject) =>
  `${obj.x},${obj.y},${obj.width},${obj.height},${JSON.stringify(obj.data)}`

const PASSIVE_TOOLS = new Set(["pen", "rectangle", "circle", "triangle", "diamond", "sticky", "line"])

export function useShapeRenderer({
  objects,
  viewportRef,
  itemsLayerRef,
  interactionRef,
  objectsRef,
  objectMapRef,
  drawSelectionRef,
  toolRef,
  tool,
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
    const graphicsMap = interaction.graphicsMap
    const isPassive = PASSIVE_TOOLS.has(tool)
    graphicsMap.forEach((container) => {
      container.eventMode = isPassive ? "none" : "static"
      container.cursor = isPassive ? "crosshair" : "pointer"
    })
  }, [tool])

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

    const isPassive = PASSIVE_TOOLS.has(toolRef.current)

    objects.forEach(obj => {
      let container = graphicsMap.get(obj.id)

      if (!container) {
        container = new Container()
        container.eventMode = isPassive ? "none" : "static"
        container.cursor = isPassive ? "crosshair" : "pointer"
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
  onTextCreate: (x: number, y: number) => void,
  disabledRef: React.RefObject<boolean | undefined>,
) {
  let lastUpTime = 0

  const onPointerUp = (e: any) => {
    if (interaction.isEditing || disabledRef.current) return

    // only handle double-tap in select mode
    if (toolRef.current !== "select") return

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

      if (currentObj.type === "text" || currentObj.type === "sticky") {
        onTextOpen(currentObj.id)
      }
      return
    }
    lastUpTime = now
  }

  const onPointerDown = (e: any) => {
    if (interaction.isEditing || disabledRef.current) return

    const currentTool = toolRef.current

    // text tool on a text/sticky object → open editor, stop propagation
    if (currentTool === "text") {
      // e.stopPropagation()
      const currentObj = objectMapRef.current.get(obj.id)
      if (currentObj?.type === "sticky" || currentObj?.type === "text") {
        e.stopPropagation()
        onTextOpen(obj.id)
      }
      return
    }

    // all non-select tools: do NOT stop propagation, do NOT select
    // let the event fall through to the viewport (pen draws, etc.)
    if (currentTool !== "select") return

    // --- select mode only below ---
    e.stopPropagation()

    const currentObj = objectMapRef.current.get(obj.id)
    if (!currentObj) return

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