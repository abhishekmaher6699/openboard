import { useEffect, useRef } from "react";
import type { BoardActivity, BoardObject } from "../types/board";

type Props = {
  boardId: string;
  objectsRef: React.MutableRefObject<BoardObject[]>;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  onActivity?: (activity: BoardActivity) => void;
  onRestore?: (snapshot: BoardObject[]) => void;
};

export default function useBoardSocket({ boardId, objectsRef, setObjects, onActivity, onRestore }: Props) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const connect = () => {
    if (unmountedRef.current) return;

    const token = localStorage.getItem("access");
    const socket = new WebSocket(`ws://localhost:8000/ws/board/${boardId}/?token=${token}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WS connected");
      reconnectAttemptsRef.current = 0;
    };

    socket.onerror = (err) => console.error("WS error", err);

    socket.onclose = () => {
      console.log("WS closed");
      if (unmountedRef.current) return;

      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(1000 * 2 ** attempts, 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})`);
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "activity_created") {
        onActivityRef.current?.(data.activity);
        return;
      }

      if (data.type === "restore_snapshot") {
        onRestoreRef.current?.(data.snapshot);
        return;
      }

      const SINGLE_OBJECT_UPDATE_TYPES = new Set([
        "update_object", "move_shape", "resize_shape",
        "update_color", "update_text", "bring_forward",
        "send_back", "bring_to_front", "send_to_back",
        "bold_text", "italic_text", "font_size",
        "align_text", "font_family", "text_color",
      ]);

      if (SINGLE_OBJECT_UPDATE_TYPES.has(data.type)) {
        setObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== data.id) return obj;
            const changes = data.changes;
            if (changes.data) {
              return { ...obj, ...changes, data: { ...obj.data, ...changes.data } };
            }
            return { ...obj, ...changes };
          })
        );
      }

      if (data.type === "move_many") {
        setObjects((prev) =>
          prev.map((obj) => {
            const move = data.moves.find((m: any) => m.id === obj.id);
            return move ? { ...obj, x: move.x, y: move.y } : obj;
          })
        );
      }

      if (data.type === "resize_many") {
        setObjects((prev) =>
          prev.map((obj) => {
            const r = data.resizes.find((r: any) => r.id === obj.id);
            return r ? { ...obj, x: r.x, y: r.y, width: r.width, height: r.height } : obj;
          })
        );
      }

      if (data.type === "delete_shape") {
        setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
      }

      if (data.type === "delete_many") {
        setObjects((prev) => prev.filter((obj) => !data.ids.includes(obj.id)));
      }

      if (data.type === "create_shape") {
        setObjects((prev) => {
          if (prev.some(o => o.id === data.object.id)) return prev;
          return [...prev, data.object];
        });
      }
    };
  };

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
    };
  }, [boardId]);

  const snapshot = () => [...objectsRef.current];

  const send = (payload: object) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  };

  const sendUpdate = (
    id: string,
    changes: Partial<BoardObject> & { data?: Record<string, any> },
    actionType: string = "update_object"
  ) =>
    send({ type: actionType, id, changes, before_snapshot: snapshot() });

  const sendManyMoves = (moves: { id: string; x: number; y: number }[]) =>
    send({ type: "move_many", moves, before_snapshot: snapshot() });

  const sendResizeMany = (resizes: { id: string; width: number; height: number; x: number; y: number }[]) =>
    send({ type: "resize_many", resizes, before_snapshot: snapshot() });

  const sendDelete = (id: string, before?: BoardObject[]) =>
    send({ type: "delete_shape", id, before_snapshot: before ?? snapshot() });

  const sendManyDelete = (ids: string[], before?: BoardObject[]) =>
    send({ type: "delete_many", ids, before_snapshot: before ?? snapshot() });

  const sendCreate = (object: BoardObject, before?: BoardObject[]) =>
    send({ type: "create_shape", object, before_snapshot: before ?? snapshot() });

  const sendRestoreSnapshot = (snap: BoardObject[]) =>
    send({ type: "restore_snapshot", snapshot: snap });

  const sendUndo = () =>{ 
    send({ type: "undo" });
  }

  const sendRedo = () =>{ 
    send({ type: "redo" });
  }
  return {
    sendUpdate,
    sendManyMoves,
    sendResizeMany,
    sendDelete,
    sendManyDelete,
    sendCreate,
    sendRestoreSnapshot,
    sendUndo,
    sendRedo
  };
}