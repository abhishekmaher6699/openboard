import { Application } from "@pixi/react";
import { useState, useEffect, useRef } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../lib/useBoardSocket";
import FloatingToolbar from "./features/FloatingToolbar";
import ActivityPanel from "./features/activity/ActivityPanel";
import PreviewBanner from "./features/activity/Previewbanner";
import { useFloatingToolbar } from "./canvas/interaction/useFloatingtoolbar";
import { useBoardObjects } from "./features/useBoardObjects";
import { useBoardToolbar } from "./features/useBoardToolbar";
import { useBoardActivity } from "../../hooks/useBoardActivity";
import { useActivityPreview } from "../../hooks/useActivityPreview";
import type { BoardObject, Tool } from "../../types/board";
import { getBoardObjects } from "../../api/board_objects";
import BoardControls from "./features/BoardControls";
import { useUndoRedo } from "./canvas/interaction/useUndoRedo";




export default function PixiBoard({ boardId }: { boardId: string }) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#ff0000");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);

  const viewportRef = useRef<any>(null);
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map());
  const objectsRef = useRef<BoardObject[]>([]);
  const clearSelectionRef = useRef<() => void>(() => {});

  // keep objectsRef in sync with objects state
  useEffect(() => {
    objectsRef.current = objects;
    objectMapRef.current = new Map(objects.map((o) => [o.id, o]));
  }, [objects]);

  const {
    toolbar,
    update: updateToolbar,
    hide: hideToolbar,
  } = useFloatingToolbar(viewportRef, objectMapRef);
  const { activities, loading, addActivity } = useBoardActivity(boardId);
  const {
    isPreviewMode,
    previewObjects,
    previewLabel,
    enterPreview,
    exitPreview,
  } = useActivityPreview();

  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const socket = useBoardSocket({
    boardId,
    objectsRef,
    setObjects,
    onActivity: addActivity,
    onRestore: (snapshot) => {
      setObjects(snapshot);
      exitPreview();
    },
  });


  useUndoRedo({
    onUndo: socket.sendUndo,
    onRedo: socket.sendRedo
  })
  
  const { sendRestoreSnapshot } = socket;

  const {
    createNewObject,
    moveObject,
    moveManyObjects,
    deleteObject,
    deleteManyObjects,
    resizeObject,
    resizeManyObjects,
    updateColor,
    updateText,
  } = useBoardObjects({ boardId, color, objects, setObjects, ...socket });

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

  const handleRestore = (snapshot: BoardObject[]) => {
    sendRestoreSnapshot(snapshot);
    setObjects(snapshot);
    exitPreview();
  };

  const displayObjects = isPreviewMode ? previewObjects : objects;

    useEffect(() => {
      if (isPreviewMode) {
        clearSelectionRef.current?.()
        hideToolbar()
      }
    }, [isPreviewMode])

  return (
    <>
      {isPreviewMode && (
        <PreviewBanner
          label={previewLabel}
          onRestore={() => handleRestore(previewObjects)}
          onExit={exitPreview}
        />
      )}

      <BoardControls
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={handleColorChange}
        onToggleActivity={() => setActivityPanelOpen((o) => !o)}
        activityOpen={activityPanelOpen}
      />

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

      <ActivityPanel
        activities={activities}
        loading={loading}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
        onPreview={enterPreview}
        onRestore={handleRestore}
        activeSnapshot={isPreviewMode ? previewObjects : null}
        exitPreview={exitPreview}
      />

      <Application
        resizeTo={window}
        background={0xffffff}
        antialias
        resolution={window.devicePixelRatio}
        autoDensity
      >
        <BoardCanvas
          objects={displayObjects}
          tool={isPreviewMode ? "select" : tool}
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
          onToolbarUpdate={isPreviewMode ? undefined : updateToolbar}
          viewportRef={viewportRef}
          objectMapRef={objectMapRef}
          clearSelectionRef={clearSelectionRef}
          previewMode={isPreviewMode}
        />
      </Application>
    </>
  );
}
