import { useEffect, useRef } from "react";
import type { BoardActivity, BoardObject } from "../types/board";
import type { BoardDiff } from "../lib/diffUtils";
import { applyDiff } from "../lib/diffUtils";
import { getValidToken } from "../api/client";

type Props = {
  boardId: string;
  objectsRef: React.RefObject<BoardObject[]>;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  onActivity?: (activity: BoardActivity, deletedIds?: string[]) => void;
  onRestore?: (snapshot: BoardObject[], deletedIds: string[]) => void;
  onUndoApplied?: (cursorSequence: number, userId: number) => void;
  onRedoApplied?: (cursorSequence: number, userId: number) => void;
};

export default function useBoardSocket({
  boardId,
  objectsRef,
  setObjects,
  onActivity,
  onRestore,
  onUndoApplied,
  onRedoApplied,
}: Props) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const onUndoAppliedRef = useRef(onUndoApplied);
  onUndoAppliedRef.current = onUndoApplied;
  const onRedoAppliedRef = useRef(onRedoApplied);
  onRedoAppliedRef.current = onRedoApplied;

  const pendingRef = useRef<object[]>([]);

  const connect = async () => {
    if (unmountedRef.current) return;

    const token = await getValidToken();
    if (!token) {
      console.log("No valid token, cannot connect websocket");
      return;
    }
    const socket = new WebSocket(
      `ws://localhost:8000/ws/board/${boardId}/?token=${token}`,
    );
    socketRef.current = socket;

    socket.onopen = () => {
      // console.log("WS connected");
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

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "activity_created") {
        onActivityRef.current?.(data.activity, data.deleted_ids ?? []);
        return;
      }

      if (data.type === "restore_snapshot") {
        onRestoreRef.current?.(data.snapshot, data.deleted_ids ?? []);

        if (data.activity) {
          onActivityRef.current?.(data.activity, []);
        }
        return;
      }

      if (data.type === "undo_applied") {
        const inv = data.inv_diff as BoardDiff;
        // console.log("undo applied: ", JSON.stringify(inv));
        setObjects((prev) => applyDiff(prev, inv));
        onUndoAppliedRef.current?.(data.cursor_sequence ?? 0, data.user_id);
        return;
      }

      if (data.type === "redo_applied") {
        const diff = data.diff as BoardDiff;
        setObjects((prev) => applyDiff(prev, diff));
        onRedoAppliedRef.current?.(data.cursor_sequence ?? 0, data.user_id);
        return;
      }

      const SINGLE_OBJECT_UPDATE_TYPES = new Set([
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

      if (SINGLE_OBJECT_UPDATE_TYPES.has(data.type)) {
        setObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== data.id) return obj;
            const changes = data.changes;
            if (changes.data) {
              return {
                ...obj,
                ...changes,
                data: { ...obj.data, ...changes.data },
              };
            }
            return { ...obj, ...changes };
          }),
        );
      }

      const MANY_UPDATE_TYPES = new Set([
        "update_color_many",
        "bold_text",
        "italic_text",
        "font_size",
        "align_text",
        "font_family",
        "text_color",
      ]);

      if (MANY_UPDATE_TYPES.has(data.type)) {
        setObjects((prev) =>
          prev.map((obj) => {
            const u = data.updates?.find((u: any) => u.id === obj.id);
            if (!u) return obj;
            const changes = u.changes;
            if (changes.data) {
              return {
                ...obj,
                ...changes,
                data: { ...obj.data, ...changes.data },
              };
            }
            return { ...obj, ...changes };
          }),
        );
      }

      if (data.type === "move_many") {
        setObjects((prev) =>
          prev.map((obj) => {
            const move = data.moves.find((m: any) => m.id === obj.id);
            return move ? { ...obj, x: move.x, y: move.y } : obj;
          }),
        );
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
      }

      if (data.type === "delete_shape") {
        setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
      }

      if (data.type === "delete_many") {
        setObjects((prev) => prev.filter((obj) => !data.ids.includes(obj.id)));
      }

      if (data.type === "create_many") {
        setObjects((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const newObjects = (data.objects as BoardObject[]).filter(
            (o) => !existingIds.has(o.id),
          );
          return [...prev, ...newObjects];
        });
      }

      if (data.type === "create_shape") {
        setObjects((prev) => {
          if (prev.some((o) => o.id === data.object.id)) return prev;
          return [...prev, data.object];
        });
      }
    };
  };

  useEffect(() => {
    unmountedRef.current = false;
    connect(); // async, fine to call without await here
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
      console.log("saved to pending", payload);
      pendingRef.current.push(payload);
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    console.log("sending:", payload);
    socket.send(JSON.stringify(payload));
  };

  const sendUpdate = (
    id: string,
    changes: Partial<BoardObject> & { data?: Record<string, any> },
    actionType: string = "update_object",
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
