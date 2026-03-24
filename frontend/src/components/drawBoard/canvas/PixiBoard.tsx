import { Application } from "@pixi/react";
import { useState, useEffect, useRef, memo } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../../hooks/websockets/useBoardSocket";
import FloatingToolbar from "../controls/FloatingToolbar";
import ActivityPanel from "../activity/ActivityPanel";
import PreviewBanner from "../activity/Previewbanner";
import ActiveUsers from "../presence/ActiveUsers";
import RemoteCursors from "../presence/RemoteCursors";
import { useFloatingToolbar } from "../../../hooks/board/controls/useFloatingtoolbar";
import { useBoardObjects } from "../../../hooks/board/interactions/useBoardObjects";
import { useBoardToolbar } from "../../../hooks/board/controls/useBoardtoolbar";
import { useBoardActivity } from "../../../hooks/board/activity/useBoardActivity";
import { useActivityPreview } from "../../../hooks/board/activity/useActivityPreview";
import { useUndoRedo } from "../../../hooks/board/interactions/useUndoRedo";
import { usePresence } from "../../../hooks/board/presence/UsePresence";
import type { BoardObject, Tool } from "../../../types/board";
import { getBoardObjects } from "../../../api/boardObjects";
import BoardControls from "../controls/BoardControls";
import RemoteSelections from "../presence/RemoteSelection";

import { useChat } from "../../../hooks/board/chat/useChat";
import ChatPanel from "../chat/ChatPanel";
import { MessageCircle } from "lucide-react";

import { useTheme } from "../../../context/theme-context";
import ThemeToggle from "../../ui/ThemeToggle";
import { boardShell } from "../boardChromeTheme";

export default memo(function PixiBoard({
  boardId,
  boardOwnerId,
}: {
  boardId: string;
  boardOwnerId: number | null;
}) {
  //  console.log("PixiBoard render", boardId);
  const { theme } = useTheme();
  // console.log("useTheme value:", theme);
  const isDark = theme === "dark";

  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");

  const [color, setColor] = useState(() => (isDark ? "#ffffff" : "#000000"));

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(3);

  const [currentUserId] = useState<number | null>(() => {
    const token = localStorage.getItem("access");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = Number(payload.user_id);
      return isNaN(id) ? null : id;
    } catch {
      return null;
    }
  });

  const { messages, onChatMessage, onReaction } = useChat(currentUserId);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOwner = boardOwnerId !== null && currentUserId === boardOwnerId;

  const viewportRef = useRef<any>(null);
  const objectMapRef = useRef<Map<string, BoardObject>>(new Map());
  const objectsRef = useRef<BoardObject[]>([]);
  const clearSelectionRef = useRef<() => void>(() => {});

  useEffect(() => {
    objectsRef.current = objects;
    objectMapRef.current = new Map(objects.map((o) => [o.id, o]));
  }, [objects]);

  useEffect(() => {
    setColor(isDark ? "#ffffff" : "#000000");
  }, [isDark]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // if (!chatOpen) setUnreadCount((c) => c + 1);
  }, [messages]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

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
    previewSequence,
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
  } = useBoardActivity(boardId, currentUserId);

  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const socket = useBoardSocket({
    boardId,
    objectsRef,
    setObjects,
    onActivity: (activity, deletedIds) => addActivity(activity, deletedIds),
    onRestore: (snapshot, deletedIds) => {
      setObjects(snapshot);
      exitPreview();
      clearSelectionRef.current?.();
      hideToolbar();
      onRestoreApplied(deletedIds);
    },
    onUndoApplied: (cursorSequence, userId) => {
      onUndoApplied(cursorSequence, Number(userId), Number(currentUserId));
    },
    onRedoApplied: (cursorSequence, userId) => {
      onRedoApplied(cursorSequence, Number(userId), Number(currentUserId));
    },
    onChatMessage,
    onReaction,
  });

  const { users, otherUsers, kickUser } = usePresence({
    socketRef: socket.socketRef,
    currentUserId,
    onMessage: socket.registerMessageHandler,
    viewportRef, // ✅ ADD THIS
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
    updateStrokeWidth,
    updateLine,
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
    handleStrokeWidth,
    handleStrokeWidthPreview,
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
    sendUpdateMany: socket.sendUpdateMany,
    updateStrokeWidth,
  });

  useUndoRedo({
    onUndo: socket.sendUndo,
    onRedo: socket.sendRedo,
  });

  useEffect(() => {
    if (isPreviewMode) {
      clearSelectionRef.current?.();
      hideToolbar();
    }
  }, [isPreviewMode]);

  useEffect(() => {
    clearSelectionRef.current?.();
    hideToolbar();
  }, [tool]);

  useEffect(() => {
    const ws = socket.socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({ type: "selection_update", selected_ids: selectedIds }),
    );
  }, [selectedIds]);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const objectIds = new Set(objects.map((o) => o.id));
    const missingIds = selectedIds.filter((id) => !objectIds.has(id));
    if (missingIds.length > 0) {
      clearSelectionRef.current?.();
      hideToolbar();
    }
  }, [objects]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) updateColor(selectedIds, newColor);
  };

  const handleRestore = (snapshot: BoardObject[], sequence: number) => {
    sendRestoreSnapshot(snapshot, sequence);
    setObjects(snapshot);
    exitPreview();
  };

  const displayObjects = isPreviewMode ? previewObjects : objects;

  return (
    <>
      {isPreviewMode && (
        <PreviewBanner
          label={previewLabel}
          onRestore={() => handleRestore(previewObjects, previewSequence)}
          onExit={exitPreview}
        />
      )}

      {/* Active users top-left */}
      <ActiveUsers
        users={users}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKick={kickUser}
      />
      <RemoteSelections
        users={otherUsers}
        objects={objects}
        viewportRef={viewportRef}
        isPreviewMode={isPreviewMode}
      />
      {/* Remote cursors */}
      <RemoteCursors users={otherUsers} viewportRef={viewportRef} />

      <BoardControls
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={handleColorChange}
        onToggleActivity={() => setActivityPanelOpen((o) => !o)}
        activityOpen={activityPanelOpen}
        onUndo={socket.sendUndo}
        onRedo={socket.sendRedo}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
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
        onStrokeWidth={handleStrokeWidth}
        onStrokeWidthPreview={handleStrokeWidthPreview}
      />

      <ActivityPanel
        activities={activities}
        loading={loading}
        ready={ready}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
        onPreview={enterPreview}
        onRestore={(snapshot, sequence) => handleRestore(snapshot, sequence)}
        activeSnapshot={isPreviewMode ? previewObjects : null}
        currentActivityId={isPreviewMode ? null : currentActivityId}
        exitPreview={exitPreview}
        objects={objects}
      />

      <div className="fixed top-16 left-4 z-[9999] rounded-full border-2 border-[#0a0a0a] bg-[#f5f0e8]/96 px-2 py-2 shadow-[3px_3px_0px_#0a0a0a] backdrop-blur-sm dark:border-[#f5f0e8] dark:bg-[#1e1e1e]/96 dark:shadow-[3px_3px_0px_#f5f0e8]">
        <ThemeToggle />
      </div>

      <div className="fixed bottom-15 right-5 z-[9999]">
        <button
          onClick={() => setChatOpen((o) => !o)}
          className={`relative flex h-10 w-10 items-center justify-center ${boardShell} transition-colors hover:bg-[#f5f0e8] dark:hover:bg-[#1e1e1e]`}
        >
          <MessageCircle
            size={17}
            className="text-[#0a0a0a] dark:text-[#f5f0e8]"
          />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-[#d62828] px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        currentUserId={currentUserId}
        onSend={socket.sendChatMessage}
        onReaction={(messageId, emoji) => {
          socket.sendReaction(messageId, emoji);
        }}
      />

      <Application
        key={theme}
        resizeTo={window}
        background={isDark ? 0x1e1e1e : 0xffffff}
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
          onLineUpdate={updateLine}
          onToolbarUpdate={isPreviewMode ? undefined : updateToolbar}
          viewportRef={viewportRef}
          objectMapRef={objectMapRef}
          clearSelectionRef={clearSelectionRef}
          previewMode={isPreviewMode}
          color={isPreviewMode ? "#ff0000" : color}
          strokeWidth={strokeWidth}
          selectedIds={selectedIds}
        />
      </Application>
    </>
  );
});
