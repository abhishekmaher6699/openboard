import { Graphics } from "pixi.js"
import { useEffect, useRef } from "react"
import type { BoardObject, UseMarqueeProps } from "../../../../types/board"



export function useMarquee({
  viewportRef,
  overlayLayerRef,
  objectsRef,
  drawSelectionRef,
  interactionRef,
  disabled
}: UseMarqueeProps) {

  const interaction = interactionRef.current

  const marqueeRef = useRef<Graphics | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const drawingRef = useRef(false)
  const isPanRef = useRef(false)

  useEffect(() => {

    if (disabled) return 

    const viewport = viewportRef.current
    const overlay = overlayLayerRef.current
    if (!viewport || !overlay) return

    const onDown = (e: any) => {

      if (interaction.isGroupDrag) return
      const shiftHeld = e.originalEvent?.shiftKey ?? false

      if (!shiftHeld) {
        isPanRef.current = true
        return
      }
      isPanRef.current = false
      viewport.plugins.pause("drag")

      const pos = viewport.toWorld(e.global)
      startRef.current = { x: pos.x, y: pos.y }
      drawingRef.current = false
    }

    const onMove = (e: any) => {

      if (interaction.isGroupDrag) return
      if (isPanRef.current || !startRef.current) return

      const pos = viewport.toWorld(e.global)
      const dx = pos.x - startRef.current.x
      const dy = pos.y - startRef.current.y

      if (!drawingRef.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return

      drawingRef.current = true
      interaction.isMarqueeActive = true

      if (!marqueeRef.current) {
        const g = new Graphics()
        overlay.addChild(g)
        marqueeRef.current = g
      }

      const g = marqueeRef.current
      g.clear()

      const x = Math.min(startRef.current.x, pos.x)
      const y = Math.min(startRef.current.y, pos.y)
      const w = Math.abs(dx)
      const h = Math.abs(dy)

      g.rect(x, y, w, h)
      g.fill({ color: 0x3b82f6, alpha: 0.1 })
      g.rect(x, y, w, h)
      g.stroke({ width: 1, color: 0x3b82f6, alpha: 0.8 })
    }

    const onUp = (e: any) => {
      interaction.isGroupDrag = false
      if (isPanRef.current) {
        isPanRef.current = false
        return
      }

      const start = startRef.current
      if (!start) return

      if (drawingRef.current) {
        const pos = viewport.toWorld(e.global)

        const selX = Math.min(start.x, pos.x)
        const selY = Math.min(start.y, pos.y)
        const selW = Math.abs(pos.x - start.x)
        const selH = Math.abs(pos.y - start.y)

        const newSelected = new Set<string>()

        objectsRef.current.forEach((obj: BoardObject) => {
          const objW = obj.width ?? 200
          const objH = obj.height ?? 120

          const overlaps = !(
            obj.x + objW < selX ||
            obj.x > selX + selW ||
            obj.y + objH < selY ||
            obj.y > selY + selH
          )

          if (overlaps) newSelected.add(obj.id)
        })

        interaction.selected = newSelected
        drawSelectionRef.current(newSelected)
      }

      if (marqueeRef.current) {
        overlay.removeChild(marqueeRef.current)
        marqueeRef.current.destroy()
        marqueeRef.current = null
      }

      startRef.current = null
      drawingRef.current = false
      interaction.isMarqueeActive = false
      viewport.plugins.resume("drag")
    }

    viewport.on("pointerdown", onDown)
    viewport.on("pointermove", onMove)
    viewport.on("pointerup", onUp)
    viewport.on("pointerupoutside", onUp)

    return () => {
      viewport.off("pointerdown", onDown)
      viewport.off("pointermove", onMove)
      viewport.off("pointerup", onUp)
      viewport.off("pointerupoutside", onUp)
    }
  }, [])
}