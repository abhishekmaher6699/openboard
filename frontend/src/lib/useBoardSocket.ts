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

    socket.onopen = () => {
      console.log("WS connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "move_shape") {
        setObjects((prev) =>
          prev.map((obj) =>
            obj.id === data.id ? { ...obj, x: data.x, y: data.y } : obj,
          ),
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

      if (data.type === "resize_shape") {
        setObjects((prev) =>
          prev.map((obj) =>
            obj.id === data.id
              ? { ...obj, width: data.width, height: data.height, x: data.x, y: data.y }
              : obj,
          ),
        );
      }

      if (data.type === "delete_shape") {
        setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
      }

      if (data.type === "delete_many") {
        setObjects((prev) => prev.filter((obj) => !data.ids.includes(obj.id)));
      }

      if (data.type === "create_shape") {
        setObjects((prev) => [...prev, data.object]);
      }

      if (data.type === "update_color") {
        setObjects((prev) =>
          prev.map((obj) =>
            data.ids.includes(obj.id)
              ? { ...obj, data: { ...obj.data, fill: data.fill } }
              : obj,
          ),
        );
      }
    };

    socket.onerror = (err) => {
      console.error("WS error", err);
    };

    socket.onclose = () => {
      console.log("WS closed");
    };

    return () => socket.close();
  }, [boardId]);

  const sendMove = (id: string, x: number, y: number) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "move_shape", id, x, y }));
  };

  const sendManyMoves = (moves: { id: string; x: number; y: number }[]) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "move_many", moves }));
  };

  const sendResize = (id: string, width: number, height: number, x: number, y: number) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "resize_shape", id, width, height, x, y }));
  };

  const sendDelete = (id: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "delete_shape", id }));
  };

  const sendManyDelete = (ids: string[]) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "delete_many", ids }));
  };

  const sendCreate = (object: BoardObject) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "create_shape", object }));
  };

  const sendColorUpdate = (ids: string[], fill: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "update_color", ids, fill }));
  };

  return { sendMove, sendManyMoves, sendDelete, sendManyDelete, sendCreate, sendResize, sendColorUpdate };
}