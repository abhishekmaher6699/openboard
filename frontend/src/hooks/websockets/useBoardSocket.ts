import { useEffect, useRef } from "react";
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
}: UseBoardSocketProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const pendingRef = useRef<object[]>([]);

  // stable refs for callbacks
  const onActivityRef = useRef(onActivity);
  const onRestoreRef = useRef(onRestore);
  const onUndoAppliedRef = useRef(onUndoApplied);
  const onRedoAppliedRef = useRef(onRedoApplied);
  onActivityRef.current = onActivity;
  onRestoreRef.current = onRestore;
  onUndoAppliedRef.current = onUndoApplied;
  onRedoAppliedRef.current = onRedoApplied;

  const handleMessage = (data: any) => {
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
        }),
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
        }),
      );
      return;
    }

    if (data.type === "move_many") {
      setObjects((prev) =>
        prev.map((obj) => {
          const move = data.moves.find((m: any) => m.id === obj.id);
          return move ? { ...obj, x: move.x, y: move.y } : obj;
        }),
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
        }),
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
        return [
          ...prev,
          ...(data.objects as BoardObject[]).filter(
            (o) => !existingIds.has(o.id),
          ),
        ];
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
  };

  const connect = async () => {
    if (unmountedRef.current) return;
    const token = await getValidToken();
    if (!token) return;

    const socket = new WebSocket(
      `ws://localhost:8000/ws/board/${boardId}/?token=${token}`,
    );
    socketRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      pendingRef.current.forEach((msg) => socket.send(JSON.stringify(msg)));
      pendingRef.current = [];
    };

    socket.onerror = (err) => console.error("WS error", err);

    socket.onclose = () => {
      if (unmountedRef.current) return;
      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
    };

    socket.onmessage = (event) => handleMessage(JSON.parse(event.data));
  };

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
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
    diff?: BoardDiff,
  ) => send({ type: actionType, id, changes, diff });

  const sendUpdateMany = (
    updates: { id: string; changes: Record<string, any> }[],
    actionType: string,
    diff: BoardDiff,
  ) => send({ type: actionType, updates, diff });

  const sendManyMoves = (
    moves: { id: string; x: number; y: number }[],
    diff: BoardDiff,
  ) => send({ type: "move_many", moves, diff });

  const sendResizeMany = (
    resizes: {
      id: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }[],
    diff: BoardDiff,
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

  return {
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
  };
}
