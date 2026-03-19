import { useApplication } from "@pixi/react";
import { useEffect, useRef } from "react";

import { useViewport } from "../../../hooks/board/canvas/useViewport";
import { useShapeRenderer } from "../../../hooks/board/canvas/useShapeRenderer";
import { useDrag } from "../../../hooks/board/interactions/useDrag";
import { useSelection } from "../../../hooks/board/interactions/useSelection";
import { useResize } from "../../../hooks/board/interactions/useResize";
import { useMarquee } from "../../../hooks/board/interactions/useMarquee";
import { useTextEdit } from "../../../hooks/board/interactions/useTextEdit";
import { useCreate } from "../../../hooks/board/inputs/useCreate";
import { useDelete } from "../../../hooks/board/inputs/useDelete";
import { useBoardInteraction } from "../../../hooks/board/canvas/useInteractionStore";
import type { BoardCanvasProps, DrawSelectionFn } from "../../../types/canvas";
import type { BoardObject, Tool } from "../../../types/board";
import { usePen } from "../../../hooks/board/interactions/usePen";

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
  color,
  strokeWidth
}: BoardCanvasProps) {
  const { app } = useApplication();

  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(
    app,
    externalViewportRef,
  );
  const interactionRef = useBoardInteraction();
  const objectsRef = useRef<any[]>([]);
  const internalObjectMapRef = useRef<Map<string, BoardObject>>(new Map());
  const objectMapRef = externalObjectMapRef ?? internalObjectMapRef;
  const drawSelectionRef = useRef<DrawSelectionFn>(() => {});

  useEffect(() => {
    objectMapRef.current = new Map(objects.map((o) => [o.id, o]));
  }, [objects]);

  const toolRef = useRef<Tool>(tool);
  toolRef.current = tool;

  const { openEditor } = useTextEdit({
    viewportRef,
    interactionRef,
    objectMapRef,
    onTextChange,
    onToolChange: setTool,
    disabled: previewMode,
  });

  const { attachHandles } = useResize({
    viewportRef,
    interactionRef,
    objectMapRef,
    onResize,
    drawSelectionRef,
    onResizeMany,
    disabled: previewMode,
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
    disabled: previewMode,
  });

  drawSelectionRef.current = drawSelection;

  // expose clearSelection to PixiBoard via ref
  if (clearSelectionRef) {
    clearSelectionRef.current = () => {
      const interaction = interactionRef.current;
      interaction.selected = new Set();
      if (interaction.selectionGraphics)
        interaction.selectionGraphics.visible = false;
      drawSelectionRef.current(new Set());
    };
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
    disabled: previewMode,
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
    disabled: previewMode,
  });

  useMarquee({
    viewportRef,
    overlayLayerRef,
    interactionRef,
    objectsRef,
    drawSelectionRef,
    disabled: previewMode,
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
    disabled: previewMode,
  });

  usePen({
    viewportRef,
    itemsLayerRef,
    interactionRef,
    tool,
    color,
    strokeWidth,
    onCreate,
    disabled: previewMode,
  });

  useDelete({
    interactionRef,
    onDelete,
    onManyDelete,
    disabled: previewMode,
    clearSelectionRef,
    hideToolbar: onToolbarUpdate
      ? () => onToolbarUpdate(new Set(), undefined)
      : undefined,
  });

  return null;
}
