import { useApplication } from "@pixi/react";
import { useEffect, useRef } from "react";

import { useViewport } from "./canvas/useViewport";
import { useShapeRenderer } from "./canvas/rendering/useShapeRenderer";
import { useDrag } from "./canvas/interaction/useDrag";
import { useSelection } from "./canvas/interaction/useSelection";
import { useResize } from "./canvas/interaction/useResize";
import { useMarquee } from "./canvas/interaction/useMarquee";
import { useTextEdit } from "./canvas/interaction/useTextEdit";
import { useCreate } from "./canvas/input/useCreate";
import { useDelete } from "./canvas/input/useDelete";
import { useBoardInteraction } from "./canvas/useInteractionStore";

import type {
  BoardCanvasProps,
  BoardObject,
  DrawSelectionFn,
  Tool,
} from "../../types/board";

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
  onTextChange,
  onResizeMany,
  onToolbarUpdate,
  viewportRef: externalViewportRef,
  objectMapRef: externalObjectMapRef,
  clearSelectionRef,
  previewMode,
}: BoardCanvasProps) {
  const { app } = useApplication();

  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(app, externalViewportRef);
  const interactionRef = useBoardInteraction();
  const objectsRef = useRef<any[]>([]);
  const objectMapRef = externalObjectMapRef ?? useRef<Map<string, BoardObject>>(new Map());
  const drawSelectionRef = useRef<DrawSelectionFn>(() => {});


  useEffect(() => {
    objectMapRef.current = new Map(objects.map(o => [o.id, o]))
  }, [objects])

  const toolRef = useRef<Tool>(tool);
  toolRef.current = tool;

  const { openEditor } = useTextEdit({
    viewportRef,
    interactionRef,
    objectMapRef,
    onTextChange,
    onToolChange: setTool,
    disabled: previewMode
  });

  const { attachHandles } = useResize({
    viewportRef,
    interactionRef,
    objectMapRef,
    onResize,
    drawSelectionRef,
    onResizeMany,
    disabled: previewMode
  });

  const { drawSelection } = useSelection({
    overlayLayerRef,
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    attachHandles,
    onSelectionChange,
    onToolbarUpdate,
    disabled: previewMode
  });

  drawSelectionRef.current = drawSelection;

  // expose clearSelection to PixiBoard via ref
  if (clearSelectionRef) {
    clearSelectionRef.current = () => {
      const interaction = interactionRef.current
      interaction.selected = new Set()
      if (interaction.selectionGraphics) interaction.selectionGraphics.visible = false
      drawSelectionRef.current(new Set())
    }
  }

  // disable all interactions in preview mode — pan/zoom still works via viewport
  useDrag({
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    onMove,
    onManyMove,
    drawSelectionRef,
    disabled: previewMode
  });

  useShapeRenderer({
    objects,
    viewportRef,
    itemsLayerRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    drawSelectionRef,
    toolRef,
    onTextOpen: openEditor,
    disabled: previewMode
  });

  useMarquee({
    viewportRef,
    overlayLayerRef,
    interactionRef,
    objectsRef,
    drawSelectionRef,
    disabled: previewMode
  });

 useCreate({
    viewportRef,
    tool,
    onCreate,
    onToolChange: setTool,
    interactionRef,
    onTextCreate: async (x: number, y: number) => {
      const id = await onCreate("text", x, y);
      let attempts = 0;
      const waitForObj = () => {
        if (objectMapRef.current.has(id!)) {
          openEditor(id!);
          return;
        }
        if (attempts++ < 20) setTimeout(waitForObj, 50);
      };
      waitForObj();
    },
    disabled: previewMode
  });

  useDelete({
    interactionRef,
    onDelete,
    onManyDelete,
    disabled: previewMode
  });

  return null;
}