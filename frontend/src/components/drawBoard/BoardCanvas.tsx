import { useApplication } from "@pixi/react";
import { useRef } from "react";

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
}: BoardCanvasProps) {
  const { app } = useApplication();

  const { viewportRef, itemsLayerRef, overlayLayerRef } = useViewport(app);
  const interactionRef = useBoardInteraction();
  const objectsRef = useRef<any[]>([]);
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map());
  const drawSelectionRef = useRef<DrawSelectionFn>(() => {});

  // keep tool in a ref so event handlers always see the latest value
  const toolRef = useRef<Tool>(tool);
  toolRef.current = tool;

  const { openEditor, closeEditor } = useTextEdit({
    viewportRef,
    interactionRef,
    objectMapRef,
    onTextChange,
    onToolChange: setTool,
  });

  const { attachHandles } = useResize({
    viewportRef,
    interactionRef,
    objectMapRef,
    onResize,
    drawSelectionRef,
  });

  const { drawSelection } = useSelection({
    overlayLayerRef,
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    attachHandles,
    onSelectionChange,
  });

  drawSelectionRef.current = drawSelection;

  useDrag({
    viewportRef,
    interactionRef,
    objectsRef,
    objectMapRef,
    onMove,
    onManyMove,
    drawSelectionRef,
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
  });

  useMarquee({
    viewportRef,
    overlayLayerRef,
    interactionRef,
    objectsRef,
    drawSelectionRef,
  });

  useCreate({
    viewportRef,
    tool,
    onCreate,
    onToolChange: setTool,
    interactionRef,
    // when text tool clicks empty canvas, create a text object then open editor
    onTextCreate: async (x: number, y: number) => {
      console.log("onTextCreate start");
      const id = await onCreate("text", x, y);
      console.log("onCreate resolved, id:", id);
      // polling...
      let attempts = 0;
      const waitForObj = () => {
        console.log(
          "polling attempt",
          attempts,
          "has obj:",
          objectMapRef.current.has(id!),
        );
        if (objectMapRef.current.has(id!)) {
          openEditor(id!);
          return;
        }
        if (attempts++ < 20) setTimeout(waitForObj, 50);
      };
      waitForObj();
    },
  });

  useDelete({
    interactionRef,
    onDelete,
    onManyDelete,
  });

  return null;
}
