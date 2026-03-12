import { useApplication } from "@pixi/react"
import { useViewport } from "./canvas/useViewport"
import { useShapeRenderer } from "./canvas/useShapeRenderer"
import { useDrag } from "./canvas/useDrag"
import { useSelection } from "./canvas/useSelection"
import { useCreate } from "./canvas/useCreate"
import { useDelete } from "./canvas/useDelete"
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

  const {
    viewportRef,
    itemsLayerRef,
    overlayLayerRef
  } = useViewport(app)

  const {
    selectedRef,
    selectionRef,
    drawSelection
  } = useSelection({overlayLayerRef, viewportRef})

  const { activeDragRef } = useDrag({
    viewportRef,
    selectedRef,
    selectionRef,
    onMove
  })

  useShapeRenderer({
    objects,
    viewportRef,
    itemsLayerRef,
    selectedRef,
    selectionRef,
    activeDragRef,
    drawSelection
  })

  useCreate({
    viewportRef,
    tool,
    onCreate
  })

  useDelete({
    selectedRef,
    selectionRef,
    onDelete
  })

  return null
}