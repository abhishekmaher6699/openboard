import { Graphics } from "pixi.js"
import { useEffect, useRef } from "react"
import type {
  ActiveResize,
  ResizeHandle,
  SelectionOverrides,
  UseResizeProps,
} from "../../../../types/board"
import { drawShapeFromObj } from "../interaction/shapeUtils"

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
  objectMapRef,
  onResize,
  onResizeMany,
  drawSelectionRef,
}: UseResizeProps) {

  const activeResizeRef = useRef<ActiveResize | null>(null)

  function attachHandles(container: any, groupRect: { x: number; y: number; width: number; height: number }) {
    const padding = 4
    const handles: ResizeHandle[] = ["nw", "ne", "se", "sw"]

    handles.forEach((handle) => {
      const h = new Graphics()
      h.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      h.fill(0xffffff)
      h.stroke({ width: 2, color: 0x3b82f6 })
      h.eventMode = "static"
      h.cursor = getCursor(handle)

      h.x = handle.includes("e") ? groupRect.width + padding : -padding
      h.y = handle.includes("s") ? groupRect.height + padding : -padding

      h.on("pointerdown", (e: any) => {
        e.stopPropagation()

        const viewport = viewportRef.current
        if (!viewport) return

        const interaction = interactionRef.current
        const worldPos = viewport.toWorld(e.global)

        const objectSnapshots: ActiveResize["objectSnapshots"] = new Map()

        interaction.selected.forEach((id: string) => {
          const obj = objectMapRef.current.get(id)
          const g = interaction.graphicsMap?.get(id)
          if (!obj || !g) return

          objectSnapshots.set(id, {
            obj: { ...obj },
            graphics: g,
          })
        })

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        objectSnapshots.forEach(({ obj }) => {
          minX = Math.min(minX, obj.x)
          minY = Math.min(minY, obj.y)
          maxX = Math.max(maxX, obj.x + obj.width)
          maxY = Math.max(maxY, obj.y + obj.height)
        })

        activeResizeRef.current = {
          handle,
          startX: worldPos.x,
          startY: worldPos.y,
          groupX: minX,
          groupY: minY,
          groupWidth: maxX - minX,
          groupHeight: maxY - minY,
          objectSnapshots,
        }

        viewport.plugins.pause("drag")
      })

      container.addChild(h)
    })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const interaction = interactionRef.current

    const computeScale = (r: ActiveResize, worldPos: { x: number; y: number }) => {
      const dx = worldPos.x - r.startX
      const dy = worldPos.y - r.startY

      let newGW = r.groupWidth
      let newGH = r.groupHeight
      let newGX = r.groupX
      let newGY = r.groupY

      if (r.handle === "nw" || r.handle === "sw") {
        newGW = Math.max(MIN_SIZE, r.groupWidth - dx)
        newGX = r.groupX + (r.groupWidth - newGW)
      } else {
        newGW = Math.max(MIN_SIZE, r.groupWidth + dx)
      }

      if (r.handle === "nw" || r.handle === "ne") {
        newGH = Math.max(MIN_SIZE, r.groupHeight - dy)
        newGY = r.groupY + (r.groupHeight - newGH)
      } else {
        newGH = Math.max(MIN_SIZE, r.groupHeight + dy)
      }

      return {
        newGX,
        newGY,
        scaleX: newGW / r.groupWidth,
        scaleY: newGH / r.groupHeight,
      }
    }

    const onMove = (e: any) => {
      const r = activeResizeRef.current
      if (!r) return

      const pos = viewport.toWorld(e.global)
      const { newGX, newGY, scaleX, scaleY } = computeScale(r, pos)

      const overrides: SelectionOverrides = new Map()

      r.objectSnapshots.forEach(({ obj, graphics }, id) => {
        const newX = newGX + (obj.x - r.groupX) * scaleX
        const newY = newGY + (obj.y - r.groupY) * scaleY
        const newW = Math.max(MIN_SIZE, obj.width * scaleX)
        const newH = Math.max(MIN_SIZE, obj.height * scaleY)

        if (graphics) {
          // just reposition and scale the container — no redraw, no text layout
          graphics.x = newX
          graphics.y = newY
          graphics.scale.set(newW / obj.width, newH / obj.height)
        }

        overrides.set(id, { x: newX, y: newY, width: newW, height: newH })
      })

      drawSelectionRef.current(interaction.selected, overrides)
    }

    const onUp = (e: any) => {
      const r = activeResizeRef.current
      if (!r) return

      const pos = viewport.toWorld(e.global)
      const { newGX, newGY, scaleX, scaleY } = computeScale(r, pos)

      const resizes: { id: string; width: number; height: number; x: number; y: number }[] = []

      r.objectSnapshots.forEach(({ obj, graphics }, id) => {
        const newX = newGX + (obj.x - r.groupX) * scaleX
        const newY = newGY + (obj.y - r.groupY) * scaleY
        const newW = Math.max(MIN_SIZE, obj.width * scaleX)
        const newH = Math.max(MIN_SIZE, obj.height * scaleY)

        // reset scale and do a proper redraw at final size
        if (graphics) {
          graphics.scale.set(1, 1)
          drawShapeFromObj(graphics, {
            ...obj,
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          })
        }

        resizes.push({ id, width: newW, height: newH, x: newX, y: newY })
      })

      // single object uses existing onResize, multiple uses batch
      if (resizes.length === 1) {
        const r = resizes[0]
        onResize(r.id, r.width, r.height, r.x, r.y)
      } else if (resizes.length > 1) {
        onResizeMany(resizes)
      }

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