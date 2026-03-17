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

  useEffect(() => {
    const token = localStorage.getItem("access");
    const socket = new WebSocket(`ws://localhost:8000/ws/board/${boardId}/?token=${token}`);
    socketRef.current = socket;

    socket.onopen = () => console.log("WS connected");
    socket.onerror = (err) => console.error("WS error", err);
    socket.onclose = () => console.log("WS closed");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "activity_created") {
        onActivity?.(data.activity);
        return;
      }

      if (data.type === "restore_snapshot") {
        onRestore?.(data.snapshot);
        return;
      }

      if (data.type === "update_object" || data.type === "move_shape" || data.type === "resize_shape" ||
          data.type === "update_color" || data.type === "update_text" || data.type === "bring_forward" ||
          data.type === "send_back" || data.type === "bring_to_front" || data.type === "send_to_back" ||
          data.type === "bold_text" || data.type === "italic_text" || data.type === "font_size" ||
          data.type === "align_text" || data.type === "font_family" || data.type === "text_color") {
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

    return () => socket.close();
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

const sendRestoreSnapshot = (snapshot: BoardObject[]) =>
  send({ type: "restore_snapshot", snapshot });


  return {
    sendUpdate,
    sendManyMoves,
    sendResizeMany,
    sendDelete,
    sendManyDelete,
    sendCreate,
    sendRestoreSnapshot,
  };
}