import { Application } from "@pixi/react";
import { useState, useEffect, useRef } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../lib/useBoardSocket";
import FloatingToolbar from "./features/FloatingToolbar";
import ActivityPanel from "./features/activity/ActivityPanel";
import PreviewBanner from "./features/activity/Previewbanner";
import { useFloatingToolbar } from "./canvas/interaction/useFloatingtoolbar";
import { useBoardObjects } from "./features/useBoardObjects";
import { useBoardToolbar } from "./features/useBoardtoolbar";
import { useBoardActivity } from "../../hooks/useBoardActivity";
import { useActivityPreview } from "../../hooks/useActivityPreview";
import { useUndoRedo } from "./canvas/interaction/useUndoRedo";
import type { BoardObject, Tool } from "../../types/board";
import { getBoardObjects } from "../../api/board_objects";
import BoardControls from "./features/BoardControls";

export default function PixiBoard({ boardId }: { boardId: string }) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#ff0000");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const viewportRef = useRef<any>(null);
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map());
  const objectsRef = useRef<BoardObject[]>([]);
  const clearSelectionRef = useRef<() => void>(() => {});

  // keep objectsRef in sync
  useEffect(() => {
    objectsRef.current = objects;
    objectMapRef.current = new Map(objects.map((o) => [o.id, o]));
  }, [objects]);

  // get current user id for per-user cursor tracking
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.user_id ?? null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const {
    toolbar,
    update: updateToolbar,
    hide: hideToolbar,
  } = useFloatingToolbar(viewportRef, objectMapRef);
  const {
    isPreviewMode,
    previewObjects,
    previewLabel,
    enterPreview,
    exitPreview,
  } = useActivityPreview();

  const {
    activities,
    loading,
    ready,
    addActivity,
    onUndoApplied,
    onRedoApplied,
    onRestoreApplied,
    currentActivityId,
  } = useBoardActivity(boardId);

  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const socket = useBoardSocket({
    boardId,
    objectsRef,
    setObjects,
    onActivity: (activity, deletedIds) => addActivity(activity, deletedIds),
    onRestore: (snapshot) => {
      setObjects(snapshot);
      exitPreview();
      onRestoreApplied();
    },
    onUndoApplied: (cursorSequence, userId) => {
      onUndoApplied(cursorSequence, Number(userId), Number(currentUserId));
    },
    onRedoApplied: (cursorSequence, userId) => {
      onRedoApplied(cursorSequence, Number(userId), Number(currentUserId));
    },
  });

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

  useUndoRedo({
    onUndo: socket.sendUndo,
    onRedo: socket.sendRedo,
  });

  // clear selection and toolbar when entering preview mode
  useEffect(() => {
    if (isPreviewMode) {
      clearSelectionRef.current?.();
      hideToolbar();
    }
  }, [isPreviewMode]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) updateColor(selectedIds, newColor);
  };

  const handleRestore = (snapshot: BoardObject[]) => {
    sendRestoreSnapshot(snapshot);
    setObjects(snapshot);
    exitPreview();
    onRestoreApplied();
  };

  const displayObjects = isPreviewMode ? previewObjects : objects;

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
        onUndo={socket.sendUndo}
        onRedo={socket.sendRedo}
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
        ready={ready}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
        onPreview={enterPreview}
        onRestore={handleRestore}
        activeSnapshot={isPreviewMode ? previewObjects : null}
        currentActivityId={isPreviewMode ? null : currentActivityId}
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
