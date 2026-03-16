import { useState, useCallback } from "react"
import type { BoardObject } from "../../../../types/board"

export type ToolbarState = {
  visible: boolean
  x: number
  y: number
  ids: string[]
  types: string[]
}

export function useFloatingToolbar(
  viewportRef: React.RefObject<any>,
  objectMapRef: React.RefObject<Map<string, BoardObject>>,
) {
  const [toolbar, setToolbar] = useState<ToolbarState>({
    visible: false,
    x: 0,
    y: 0,
    ids: [],
    types: [],
  })

  const update = useCallback((ids: Set<string>, overrides?: Map<string, { x: number; y: number; width: number; height: number }>) => {
    const viewport = viewportRef.current
    if (!viewport || ids.size === 0) {
      setToolbar(t => ({ ...t, visible: false }))
      return
    }

    // compute bounding box of selection in world coords
    let minX = Infinity, minY = Infinity, maxX = -Infinity

    ids.forEach(id => {
      const pos = overrides?.get(id)
      const obj = objectMapRef.current.get(id)
      if (!obj) return

      const x = pos?.x ?? obj.x
      const y = pos?.y ?? obj.y
      const w = pos?.width ?? obj.width ?? 200
      // const h = pos?.height ?? obj.height ?? 120

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w)
    })

    // convert to screen coords
    const screenLeft = viewport.toScreen({ x: minX, y: minY })
    const screenRight = viewport.toScreen({ x: maxX, y: minY })

    const types = [...ids].map(id => objectMapRef.current.get(id)?.type ?? "").filter(Boolean)

    setToolbar({
      visible: true,
      x: (screenLeft.x + screenRight.x) / 2,  // center above selection
      y: screenLeft.y - 48,                     // 48px above top edge
      ids: [...ids],
      types,
    })
  }, [])

  const hide = useCallback(() => {
    setToolbar(t => ({ ...t, visible: false }))
  }, [])

  return { toolbar, update, hide }
}