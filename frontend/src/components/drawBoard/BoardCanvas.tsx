import { useApplication } from "@pixi/react"
import { useRef } from "react"
import { useViewport } from "./canvas/useViewport"
import { useShapeRenderer } from "./canvas/useShapeRenderer"
import { useDrag } from "./canvas/useDrag"
import { useSelection } from "./canvas/useSelection"
import { useCreate } from "./canvas/useCreate"
import { useDelete } from "./canvas/useDelete"
import { useResize } from "./canvas/useResize"
import type { BoardCanvasProps } from "../../types/board"

export default function BoardCanvas({
  objects,
  tool,
  onMove,
  onCreate,
  onDelete,
  onResize,
}: BoardCanvasProps) {

  const { app } = useApplication()
  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(app)

  const selectedRef = useRef<string | null>(null)
  const selectionRef = useRef<any>(null)
  const graphicsMapRef = useRef<Map<string, any>>(new Map())

  const drawSelectionRef = useRef<(obj: any) => void>(() => {})

  const { attachHandles } = useResize({
    viewportRef,
    selectedRef,
    selectionRef,
    graphicsMapRef,
    onResize,
    drawSelectionRef,
  })

  const { drawSelection } = useSelection({
    overlayLayerRef,
    viewportRef,
    selectedRef,
    selectionRef,
    attachHandles,
  })

  // Keep the ref current after every render
  drawSelectionRef.current = drawSelection

  const { activeDragRef } = useDrag({
    viewportRef,
    selectedRef,
    selectionRef,
    onMove,
  })

  useShapeRenderer({
    objects,
    viewportRef,
    itemsLayerRef,
    selectedRef,
    selectionRef,
    activeDragRef,
    graphicsMapRef,
    drawSelection,
  })

  useCreate({ viewportRef, tool, onCreate })
  useDelete({ selectedRef, selectionRef, onDelete })

  return null
}