import { Application } from "@pixi/react";
import { useState, useEffect, useRef } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../lib/useBoardSocket";
import FloatingToolbar from "./features/FloatingToolbar";
import { useFloatingToolbar } from "./canvas/interaction/useFloatingtoolbar";
import { useBoardObjects } from "./features/useBoardObjects";
import { useBoardToolbar } from "./features/useBoardtoolbar";
import type { BoardObject, Tool } from "../../types/board";
import { getBoardObjects } from "../../api/board_objects";
import BoardControls from "./features/BoardControls";

export default function PixiBoard({ boardId }: { boardId: string }) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#ff0000");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const viewportRef = useRef<any>(null);
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map());
  objectMapRef.current = new Map(objects.map((o) => [o.id, o]));
  const clearSelectionRef = useRef<() => void>(() => {});

  const { toolbar, update: updateToolbar, hide: hideToolbar } = useFloatingToolbar(viewportRef, objectMapRef);

  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const socket = useBoardSocket({ boardId, setObjects });

  const {
    objectsRef,
    createNewObject,
    moveObject,
    moveManyObjects,
    deleteObject,
    deleteManyObjects,
    resizeObject,
    resizeManyObjects,
    updateColor,
    updateText,
  } = useBoardObjects({
    boardId,
    color,
    objects,
    setObjects,
    sendUpdate: socket.sendUpdate,
    sendManyMoves: socket.sendManyMoves,
    sendDelete: socket.sendDelete,
    sendManyDelete: socket.sendManyDelete,
    sendCreate: socket.sendCreate,
    sendResizeMany: socket.sendResizeMany,
  });

  const {
    handleDelete,
    handleDuplicate,
    handleBringForward,
    handleSendBack,
    handleBringToFront,
    handleSendToBack,
    handleBold,
    handleItalic,
    handleFontSize,
    handleAlign,
    handleFontFamily,
    handleTextColor,
  } = useBoardToolbar({
    boardId,
    selectedIds,
    objectsRef,
    setObjects,
    createNewObject,
    deleteObject,
    deleteManyObjects,
    clearSelectionRef,
    hideToolbar,
    sendCreate: socket.sendCreate,
    sendUpdate: socket.sendUpdate,
  });

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) updateColor(selectedIds, newColor);
  };

  return (
    <>
      <BoardControls tool={tool} setTool={setTool} color={color} setColor={handleColorChange} />

      <FloatingToolbar
        toolbar={toolbar}
        objects={objects}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBringForward={handleBringForward}
        onSendBack={handleSendBack}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onBold={handleBold}
        onItalic={handleItalic}
        onFontSize={handleFontSize}
        onAlign={handleAlign}
        onFontFamily={handleFontFamily}
        onTextColor={handleTextColor}
      />

      <Application resizeTo={window} background={0xffffff} antialias resolution={window.devicePixelRatio} autoDensity>
        <BoardCanvas
          objects={objects}
          tool={tool}
          setTool={setTool}
          onCreate={createNewObject}
          onMove={moveObject}
          onDelete={deleteObject}
          onManyDelete={deleteManyObjects}
          onResize={resizeObject}
          onManyMove={moveManyObjects}
          onResizeMany={resizeManyObjects}
          onSelectionChange={setSelectedIds}
          onTextChange={updateText}
          onToolbarUpdate={updateToolbar}
          viewportRef={viewportRef}
          objectMapRef={objectMapRef}
          clearSelectionRef={clearSelectionRef}
        />
      </Application>
    </>
  );
}