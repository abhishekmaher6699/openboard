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

import type { BoardCanvasProps, BoardObject, DrawSelectionFn } from "../../types/board"

export default function BoardCanvas({
  objects,
  tool,
  setTool,
  onMove,
  onCreate,
  onDelete,
  onManyDelete,
  onResize,
  onManyMove,
  onSelectionChange,
}: BoardCanvasProps) {

  const { app } = useApplication()

  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(app)
  const interactionRef = useBoardInteraction()
  const objectsRef = useRef<any[]>([])
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map())

  const drawSelectionRef = useRef<DrawSelectionFn>(() => {})

  const { attachHandles } = useResize({
    viewportRef,
    interactionRef,
    objectMapRef,
    onResize,
    drawSelectionRef,
  })

  const { drawSelection } = useSelection({
    overlayLayerRef,
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    attachHandles,
    onSelectionChange,
  })

  drawSelectionRef.current = drawSelection

  useDrag({
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
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
    objectMapRef,
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
    onCreate,
    onToolChange: setTool
  })

  useDelete({
    interactionRef,
    onDelete,
    onManyDelete
  })

  return null
}