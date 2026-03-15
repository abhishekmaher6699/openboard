import { useApplication } from "@pixi/react"
import { useRef } from "react"

import { useViewport } from "./canvas/useViewport"
import { useShapeRenderer } from "./canvas/rendering/useShapeRenderer"

import { useDrag } from "./canvas/interaction/useDrag"
import { useSelection } from "./canvas/interaction/useSelection"
import { useResize } from "./canvas/interaction/useResize"
import { useMarquee } from "./canvas/interaction/useMarquee"

import { useCreate } from "./canvas/input/useCreate"
import { useDelete } from "./canvas/input/useDelete"

import { useBoardInteraction } from "./canvas/useInteractionStore"

import type { BoardCanvasProps, DrawSelectionFn } from "../../types/board"

export default function BoardCanvas({
  objects,
  tool,
  onMove,
  onCreate,
  onDelete,
  onManyDelete,
  onResize,
  onManyMove,
}: BoardCanvasProps) {

  const { app } = useApplication()

  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(app)

  const interactionRef = useBoardInteraction()

  const objectsRef = useRef<any[]>([])
  const drawSelectionRef = useRef<DrawSelectionFn>(() => {})

  const { attachHandles } = useResize({
    viewportRef,
    interactionRef,
    onResize,
    drawSelectionRef,
  })

  const { drawSelection } = useSelection({
    overlayLayerRef,
    viewportRef,
    interactionRef,
    objectsRef,
    attachHandles,
  })

  drawSelectionRef.current = drawSelection

  useDrag({
    viewportRef,
    interactionRef,
    objectsRef,
    onMove,
    onManyMove,
    drawSelectionRef,
  })

  useShapeRenderer({
    objects,
    viewportRef,
    itemsLayerRef,
    interactionRef,
    objectsRef,
    drawSelectionRef,
  })

  useMarquee({
    viewportRef,
    overlayLayerRef,
    interactionRef,
    objectsRef,
    drawSelectionRef,
  })

  useCreate({
    viewportRef,
    tool,
    onCreate
  })

  useDelete({
    interactionRef,
    onDelete,
    onManyDelete
  })

  return null
}