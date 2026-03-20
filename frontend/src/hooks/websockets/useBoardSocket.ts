import { useEffect, useRef, useCallback } from "react";
import type { UseBoardSocketProps, BoardObject } from "../../types/board";
import type { BoardDiff } from "../../lib/diffUtils";
import { applyDiff } from "../../lib/diffUtils";
import { getValidToken } from "../../api/client";

const SINGLE_UPDATE_TYPES = new Set([
  "update_object",
  "move_shape",
  "resize_shape",
  "update_color",
  "update_text",
  "bring_forward",
  "send_back",
  "bring_to_front",
  "send_to_back",
]);

const MANY_UPDATE_TYPES = new Set([
  "update_color_many",
  "bold_text",
  "italic_text",
  "font_size",
  "align_text",
  "font_family",
  "text_color",
]);

export default function useBoardSocket({
  boardId,
  setObjects,
  onActivity,
  onRestore,
  onUndoApplied,
  onRedoApplied,
  onChatMessage,
  onReaction,
}: UseBoardSocketProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const connectingRef = useRef(false);
  const initializedRef = useRef(false);
  const pendingRef = useRef<object[]>([]);

  const externalHandlersRef = useRef<Array<(data: any) => boolean>>([]);

  const onActivityRef = useRef(onActivity);
  const onRestoreRef = useRef(onRestore);
  const onUndoAppliedRef = useRef(onUndoApplied);
  const onRedoAppliedRef = useRef(onRedoApplied);

  onActivityRef.current = onActivity;
  onRestoreRef.current = onRestore;
  onUndoAppliedRef.current = onUndoApplied;
  onRedoAppliedRef.current = onRedoApplied;

  const onChatMessageRef = useRef(onChatMessage);
  const onReactionRef = useRef(onReaction);
  onChatMessageRef.current = onChatMessage;
  onReactionRef.current = onReaction;

  const registerMessageHandler = useCallback((handler: (data: any) => boolean) => {
    externalHandlersRef.current.push(handler);
    return () => {
      externalHandlersRef.current = externalHandlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  const handleMessage = (data: any) => {
    for (const handler of externalHandlersRef.current) {
      if (handler(data)) return;
    }

    if (data.type === "activity_created") {
      onActivityRef.current?.(data.activity, data.deleted_ids ?? []);
      return;
    }

    if (data.type === "restore_snapshot") {
      onRestoreRef.current?.(data.snapshot, data.deleted_ids ?? []);
      if (data.activity) onActivityRef.current?.(data.activity, []);
      return;
    }

    if (data.type === "undo_applied") {
      setObjects((prev) => applyDiff(prev, data.inv_diff as BoardDiff));
      onUndoAppliedRef.current?.(data.cursor_sequence ?? 0, data.user_id);
      return;
    }

    if (data.type === "redo_applied") {
      setObjects((prev) => applyDiff(prev, data.diff as BoardDiff));
      onRedoAppliedRef.current?.(data.cursor_sequence ?? 0, data.user_id);
      return;
    }

    if (SINGLE_UPDATE_TYPES.has(data.type)) {
      setObjects((prev) =>
        prev.map((obj) => {
          if (obj.id !== data.id) return obj;
          const { changes } = data;
          return changes.data
            ? { ...obj, ...changes, data: { ...obj.data, ...changes.data } }
            : { ...obj, ...changes };
        })
      );
      return;
    }

    if (MANY_UPDATE_TYPES.has(data.type)) {
      setObjects((prev) =>
        prev.map((obj) => {
          const u = data.updates?.find((u: any) => u.id === obj.id);
          if (!u) return obj;
          return u.changes.data
            ? { ...obj, ...u.changes, data: { ...obj.data, ...u.changes.data } }
            : { ...obj, ...u.changes };
        })
      );
      return;
    }

    if (data.type === "move_many") {
      setObjects((prev) =>
        prev.map((obj) => {
          const move = data.moves.find((m: any) => m.id === obj.id);
          return move ? { ...obj, x: move.x, y: move.y } : obj;
        })
      );
      return;
    }

    if (data.type === "resize_many") {
      setObjects((prev) =>
        prev.map((obj) => {
          const r = data.resizes.find((r: any) => r.id === obj.id);
          return r
            ? { ...obj, x: r.x, y: r.y, width: r.width, height: r.height }
            : obj;
        })
      );
      return;
    }

    if (data.type === "delete_shape") {
      setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
      return;
    }

    if (data.type === "delete_many") {
      setObjects((prev) => prev.filter((obj) => !data.ids.includes(obj.id)));
      return;
    }

    if (data.type === "create_many") {
      setObjects((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        return [...prev, ...(data.objects as BoardObject[]).filter((o) => !existingIds.has(o.id))];
      });
      return;
    }

    if (data.type === "create_shape") {
      setObjects((prev) => {
        if (prev.some((o) => o.id === data.object.id)) return prev;
        return [...prev, data.object];
      });
      return;
    }

    if (data.type === "chat_message") {
      onChatMessageRef.current?.({
        id: data.id,
        userId: data.user_id,
        username: data.username,
        text: data.text,
        reactions: data.reactions ?? {},
      });
      return;
    }

    if (data.type === "chat_reaction") {
      onReactionRef.current?.(data.message_id, data.emoji, data.user_id);
      return;
    }
  };

  const connect = async () => {
    if (unmountedRef.current) return;
    if (connectingRef.current) return;

    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    }

    connectingRef.current = true;

    const token = await getValidToken();
    if (!token) {
      connectingRef.current = false;
      return;
    }

    const socket = new WebSocket(
      `ws://10.30.0.112:8000/ws/board/${boardId}/?token=${token}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      connectingRef.current = false;
      reconnectAttemptsRef.current = 0;

      pendingRef.current.forEach((msg) =>
        socket.send(JSON.stringify(msg))
      );
      pendingRef.current = [];
    };

    socket.onerror = (err) => {
      console.error("WS error", err);
      connectingRef.current = false;
    };

    socket.onclose = () => {
      connectingRef.current = false;

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (unmountedRef.current) return;

      const delay = Math.min(
        1000 * 2 ** reconnectAttemptsRef.current,
        30000
      );
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    socket.onmessage = (event) =>
      handleMessage(JSON.parse(event.data));
  };

  useEffect(() => {
    console.log("useBoardSocket mounted, boardId:", boardId);
    if (initializedRef.current) {
       console.log("⚠️ already initialized, skipping");
       return
    };
    initializedRef.current = true;
    console.log("✅ connecting...");
    unmountedRef.current = false;
    connect();

    return () => {
        console.log("🔴 useBoardSocket cleanup fired");
      unmountedRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }

      initializedRef.current = false;
    };
  }, [boardId]);

  const send = (payload: object) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState === WebSocket.CONNECTING) {
      pendingRef.current.push(payload);
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
  };

  const sendUpdate = (
    id: string,
    changes: Partial<BoardObject> & { data?: Record<string, any> },
    actionType = "update_object",
    diff?: BoardDiff
  ) => send({ type: actionType, id, changes, diff });

  const sendUpdateMany = (
    updates: { id: string; changes: Record<string, any> }[],
    actionType: string,
    diff: BoardDiff
  ) => send({ type: actionType, updates, diff });

  const sendManyMoves = (
    moves: { id: string; x: number; y: number }[],
    diff: BoardDiff
  ) => send({ type: "move_many", moves, diff });

  const sendResizeMany = (
    resizes: { id: string; width: number; height: number; x: number; y: number }[],
    diff: BoardDiff
  ) => send({ type: "resize_many", resizes, diff });

  const sendDelete = (id: string, diff: BoardDiff) =>
    send({ type: "delete_shape", id, diff });

  const sendManyDelete = (ids: string[], diff: BoardDiff) =>
    send({ type: "delete_many", ids, diff });

  const sendCreate = (object: BoardObject, diff: BoardDiff) =>
    send({ type: "create_shape", object, diff });

  const sendRestoreSnapshot = (snap: BoardObject[], sequence: number) =>
    send({ type: "restore_snapshot", snapshot: snap, sequence });

  const sendUndo = () => send({ type: "undo" });
  const sendRedo = () => send({ type: "redo" });

  const sendChatMessage = (text: string) =>
    send({ type: "chat_message", text });

  const sendReaction = (messageId: string, emoji: string) =>
    send({ type: "chat_reaction", message_id: messageId, emoji });


  return {
    socketRef,
    registerMessageHandler,
    sendUpdate,
    sendUpdateMany,
    sendManyMoves,
    sendResizeMany,
    sendDelete,
    sendManyDelete,
    sendCreate,
    sendRestoreSnapshot,
    sendUndo,
    sendRedo,
    sendChatMessage,
    sendReaction
  };
}