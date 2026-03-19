import { Graphics } from "pixi.js"
import { useEffect, useRef } from "react"
import type { UseMarqueeProps } from "../../../types/canvas"
import type { BoardObject } from "../../../types/board"

const LONG_PRESS_MS = 400
const MOVE_THRESHOLD = 10

export function useMarquee({
  viewportRef,
  overlayLayerRef,
  objectsRef,
  drawSelectionRef,
  interactionRef,
  disabled,
}: UseMarqueeProps) {
  const marqueeRef = useRef<Graphics | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const drawingRef = useRef(false)
  const isPanRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const activePointersRef = useRef(0)

  useEffect(() => {
    if (disabled) return

    const viewport = viewportRef.current
    const overlay = overlayLayerRef.current
    if (!viewport || !overlay) return

    const interaction = interactionRef.current

    const isTouch = (e: any) =>
      e.originalEvent?.pointerType === "touch"

    const cancelLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    const onDown = (e: any) => {
      if (interaction.isGroupDrag) return

      activePointersRef.current++

      // cancel marquee if second finger comes down (pinch)
      if (activePointersRef.current > 1) {
        cancelLongPress()
        isPanRef.current = true
        viewport.plugins.resume("drag")
        startRef.current = null
        drawingRef.current = false
        longPressTriggeredRef.current = false
        return
      }

      const shiftHeld = e.originalEvent?.shiftKey ?? false
      const touch = isTouch(e)

      if (!shiftHeld && !touch) {
        // desktop without shift — just pan
        isPanRef.current = true
        return
      }

      if (touch) {
        // on touch — start long press timer
        const pos = viewport.toWorld(e.global)
        longPressTriggeredRef.current = false

        longPressTimerRef.current = setTimeout(() => {
          longPressTriggeredRef.current = true
          viewport.plugins.pause("drag")
          startRef.current = { x: pos.x, y: pos.y }
          drawingRef.current = false
          isPanRef.current = false

          // visual feedback — small flash
          if (!marqueeRef.current) {
            const g = new Graphics()
            overlay.addChild(g)
            marqueeRef.current = g
          }
          marqueeRef.current.clear()
          marqueeRef.current.circle(pos.x, pos.y, 12)
          marqueeRef.current.fill({ color: 0x3b82f6, alpha: 0.3 })
        }, LONG_PRESS_MS)

        isPanRef.current = true // allow pan until long press triggers
        return
      }

      // desktop with shift
      isPanRef.current = false
      viewport.plugins.pause("drag")
      const pos = viewport.toWorld(e.global)
      startRef.current = { x: pos.x, y: pos.y }
      drawingRef.current = false
    }

    const onMove = (e: any) => {
      if (interaction.isGroupDrag) return
      if (activePointersRef.current > 1) return

      const touch = isTouch(e)

      // on touch — cancel long press if finger moved too much
      if (touch && !longPressTriggeredRef.current) {
        const pos = viewport.toWorld(e.global)
        if (startRef.current) {
          const dx = Math.abs(pos.x - startRef.current.x)
          const dy = Math.abs(pos.y - startRef.current.y)
          if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
            cancelLongPress()
          }
        }
        if (!longPressTriggeredRef.current) return
      }

      if (isPanRef.current || !startRef.current) return

      const pos = viewport.toWorld(e.global)
      const dx = pos.x - startRef.current.x
      const dy = pos.y - startRef.current.y

      if (!drawingRef.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      drawingRef.current = true
      interaction.isMarqueeActive = true
      isPanRef.current = false

      if (!marqueeRef.current) {
        const g = new Graphics()
        overlay.addChild(g)
        marqueeRef.current = g
      }

      const x = Math.min(startRef.current.x, pos.x)
      const y = Math.min(startRef.current.y, pos.y)
      const w = Math.abs(dx)
      const h = Math.abs(dy)

      marqueeRef.current.clear()
      marqueeRef.current.rect(x, y, w, h)
      marqueeRef.current.fill({ color: 0x3b82f6, alpha: 0.1 })
      marqueeRef.current.rect(x, y, w, h)
      marqueeRef.current.stroke({ width: 1, color: 0x3b82f6, alpha: 0.8 })
    }

    const onUp = (e: any) => {
      activePointersRef.current = Math.max(0, activePointersRef.current - 1)
      cancelLongPress()
      interaction.isGroupDrag = false

      if (isPanRef.current && !longPressTriggeredRef.current) {
        isPanRef.current = false
        longPressTriggeredRef.current = false
        return
      }

      const start = startRef.current
      if (!start) {
        longPressTriggeredRef.current = false
        return
      }

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
      longPressTriggeredRef.current = false
      interaction.isMarqueeActive = false
      viewport.plugins.resume("drag")
    }

    const onCancel = () => {
      activePointersRef.current = 0
      cancelLongPress()
      longPressTriggeredRef.current = false
      isPanRef.current = false
      startRef.current = null
      drawingRef.current = false
      interaction.isMarqueeActive = false
      viewport.plugins.resume("drag")

      if (marqueeRef.current) {
        overlay.removeChild(marqueeRef.current)
        marqueeRef.current.destroy()
        marqueeRef.current = null
      }
    }

    viewport.on("pointerdown", onDown)
    viewport.on("pointermove", onMove)
    viewport.on("pointerup", onUp)
    viewport.on("pointerupoutside", onUp)
    viewport.on("pointercancel", onCancel)

    return () => {
      viewport.off("pointerdown", onDown)
      viewport.off("pointermove", onMove)
      viewport.off("pointerup", onUp)
      viewport.off("pointerupoutside", onUp)
      viewport.off("pointercancel", onCancel)
    }
  }, [])
}