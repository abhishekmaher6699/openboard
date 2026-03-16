import { useEffect, useRef } from "react";
import type { BoardObject } from "../types/board";

type Props = {
  boardId: string;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
};

export default function useBoardSocket({ boardId, setObjects }: Props) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws/board/${boardId}/`);
    socketRef.current = socket;

    socket.onopen = () => console.log("WS connected");
    socket.onerror = (err) => console.error("WS error", err);
    socket.onclose = () => console.log("WS closed");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // single object update — merges any changed fields
      if (data.type === "update_object") {
        setObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== data.id) return obj
            const changes = data.changes
            // if data field is being updated, merge it instead of replacing
            if (changes.data) {
              return { ...obj, ...changes, data: { ...obj.data, ...changes.data } }
            }
            return { ...obj, ...changes }
          })
        )
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
          // avoid duplicates if we created it ourselves
          if (prev.some(o => o.id === data.object.id)) return prev
          return [...prev, data.object]
        });
      }
    };

    return () => socket.close();
  }, [boardId]);

  const send = (payload: object) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  };

  // single object update — send any changed fields
  const sendUpdate = (id: string, changes: Partial<BoardObject> & { data?: Record<string, any> }) => {
    send({ type: "update_object", id, changes });
  };

  const sendManyMoves = (moves: { id: string; x: number; y: number }[]) =>
    send({ type: "move_many", moves });

  const sendResizeMany = (resizes: { id: string; width: number; height: number; x: number; y: number }[]) =>
    send({ type: "resize_many", resizes });

  const sendDelete = (id: string) =>
    send({ type: "delete_shape", id });

  const sendManyDelete = (ids: string[]) =>
    send({ type: "delete_many", ids });

  const sendCreate = (object: BoardObject) =>
    send({ type: "create_shape", object });

  return {
    sendUpdate,
    sendManyMoves,
    sendResizeMany,
    sendDelete,
    sendManyDelete,
    sendCreate,
  };
}