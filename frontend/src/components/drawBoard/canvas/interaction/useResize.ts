import { Graphics } from "pixi.js"
import { useEffect, useRef } from "react"
import type { ActiveResize, ResizeHandle, SelectionOverrides, UseResizeProps } from "../../../../types/board"
import { drawShape } from "../interaction/shapeUtils"

const HANDLE_SIZE = 10
const MIN_SIZE = 40

function getCursor(handle: ResizeHandle) {
  const map: Record<ResizeHandle, string> = {
    nw: "nw-resize",
    ne: "ne-resize",
    se: "se-resize",
    sw: "sw-resize",
  }
  return map[handle]
}

export function useResize({
  viewportRef,
  interactionRef,
  onResize,
  drawSelectionRef,
}: UseResizeProps) {

  const interaction = interactionRef.current
  const activeResizeRef = useRef<ActiveResize | null>(null)

  function attachHandles(container: any, obj: any) {
    const padding = 4
    const handles: ResizeHandle[] = ["nw", "ne", "se", "sw"]

    handles.forEach((handle) => {

      console.log(obj.type)
      const h = new Graphics()
      h.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      h.fill(0xffffff)
      h.stroke({ width: 2, color: 0x3b82f6 })
      h.eventMode = "static"
      h.cursor = getCursor(handle)

      // obj.x and obj.y are 0 here because container is already at shape position
      h.x = handle.includes("e") ? obj.width + padding : -padding
      h.y = handle.includes("s") ? obj.height + padding : -padding

      h.on("pointerdown", (e: any) => {
        e.stopPropagation()

        const viewport = viewportRef.current
        if (!viewport) return

        const worldPos = viewport.toWorld(e.global)
        const graphics = interaction.graphicsMap?.get(obj.id)

        interaction.selected = new Set([obj.id])

        activeResizeRef.current = {
          id: obj.id,
          handle,
          startX: worldPos.x,
          startY: worldPos.y,
          startObjX: graphics?.x ?? obj.x,
          startObjY: graphics?.y ?? obj.y,
          startWidth: obj.width,
          startHeight: obj.height,
          graphics,
          type: obj.type,
        }

        viewport.plugins.pause("drag")
      })

      container.addChild(h)
    })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const computeNewDimensions = (
      r: ActiveResize,
      worldPos: { x: number; y: number },
    ) => {
      const dx = worldPos.x - r.startX
      const dy = worldPos.y - r.startY

      let newW = r.startWidth
      let newH = r.startHeight
      let newX = r.startObjX
      let newY = r.startObjY

      if (r.handle === "nw" || r.handle === "sw") {
        newW = Math.max(MIN_SIZE, r.startWidth - dx)
        newX = r.startObjX + (r.startWidth - newW)
      } else {
        newW = Math.max(MIN_SIZE, r.startWidth + dx)
      }

      if (r.handle === "nw" || r.handle === "ne") {
        newH = Math.max(MIN_SIZE, r.startHeight - dy)
        newY = r.startObjY + (r.startHeight - newH)
      } else {
        newH = Math.max(MIN_SIZE, r.startHeight + dy)
      }

      return { newW, newH, newX, newY }
    }

    const onMove = (e: any) => {
      const r = activeResizeRef.current
      // console.log(r)
      if (!r) return

      const pos = viewport.toWorld(e.global)
      const { newW, newH, newX, newY } = computeNewDimensions(r, pos)

      if (r.graphics) {
        r.graphics.x = newX
        r.graphics.y = newY
        drawShape(r.graphics, r.type, newW, newH)
      }

      const overrides: SelectionOverrides = new Map([
        [r.id, { x: newX, y: newY, width: newW, height: newH }],
      ])
      drawSelectionRef.current(interaction.selected, overrides)
    }

    const onUp = (e: any) => {
      const r = activeResizeRef.current
      if (!r) return

      const pos = viewport.toWorld(e.global)
      const { newW, newH, newX, newY } = computeNewDimensions(r, pos)

      onResize(r.id, newW, newH, newX, newY)

      activeResizeRef.current = null
      viewport.plugins.resume("drag")
    }

    viewport.on("pointermove", onMove)
    viewport.on("pointerup", onUp)
    viewport.on("pointerupoutside", onUp)

    return () => {
      viewport.off("pointermove", onMove)
      viewport.off("pointerup", onUp)
      viewport.off("pointerupoutside", onUp)
    }
  }, [onResize])

  return { activeResizeRef, attachHandles }
}