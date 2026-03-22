import { useEffect, useRef } from "react"
import type { UseCreateProps } from "../../../types/canvas"

const SHAPE_TOOLS = ["rectangle", "circle", "triangle", "diamond", "sticky", "line"]

export function useCreate({
  viewportRef,
  tool,
  onCreate,
  onToolChange,
  onTextCreate,
  interactionRef,
  disabled
}: UseCreateProps) {

  const toolRef = useRef(tool)
  toolRef.current = tool

  const onCreateRef = useRef(onCreate)
  onCreateRef.current = onCreate

  const onTextCreateRef = useRef(onTextCreate)
  onTextCreateRef.current = onTextCreate

  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useEffect(() => {
    if (disabled) return

    const viewport = viewportRef.current
    if (!viewport) return

    const interaction = interactionRef?.current

    let lastUpTime = 0
    let pointerDownPos: { x: number; y: number } | null = null
    let activePointers = 0

    const down = (e: any) => {
      if (interaction?.isEditing) return
      if (disabledRef.current) return

      activePointers++
      pointerDownPos = { x: e.global.x, y: e.global.y }

      // ignore multi-touch (pinch)
      if (activePointers > 1) return

      const currentTool = toolRef.current

      if (currentTool === "text") {
        e.stopPropagation()
        const pos = viewport.toWorld(e.global)
        onTextCreateRef.current?.(pos.x - 100, pos.y - 40)
        return
      }

      if (!SHAPE_TOOLS.includes(currentTool)) return

      const pos = viewport.toWorld(e.global)
      onCreateRef.current(currentTool, pos.x - 100, pos.y - 60)
      onToolChange?.("select")
    }

    const up = (e: any) => {
      if (interaction?.isEditing) return
      if (disabledRef.current) return

      activePointers = Math.max(0, activePointers - 1)

      // ignore if other fingers still down (pinch end)
      if (activePointers > 0) return

      if (e.target !== viewport) return

      // ignore if finger moved too much (pan, not tap)
      if (pointerDownPos) {
        const dx = Math.abs(e.global.x - pointerDownPos.x)
        const dy = Math.abs(e.global.y - pointerDownPos.y)
        if (dx > 10 || dy > 10) {
          pointerDownPos = null
          lastUpTime = 0
          return
        }
      }
      pointerDownPos = null

      const now = Date.now()
      const currentTool = toolRef.current

      if (now - lastUpTime < 300 && currentTool === "select") {
        lastUpTime = 0
        const pos = viewport.toWorld(e.global)
        onTextCreateRef.current?.(pos.x - 100, pos.y - 40)
        return
      }

      lastUpTime = now
    }

    const cancel = () => {
      activePointers = 0
      pointerDownPos = null
    }

    viewport.on("pointerdown", down)
    viewport.on("pointerup", up)
    viewport.on("pointercancel", cancel)

    return () => {
      viewport.off("pointerdown", down)
      viewport.off("pointerup", up)
      viewport.off("pointercancel", cancel)
    }
  }, [])
}