import { useEffect, useRef } from "react";
import type { BoardObject } from "../types/board";

type Props = {
  boardId: string;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
};

export default function useBoardSocket({ boardId, setObjects }: Props) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // const socket = new WebSocket(`ws://192.168.1.74:8000/ws/board/${boardId}/`);
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

      if (data.type === "resize_shape") {
        setObjects((prev) =>
          prev.map((obj) =>
            obj.id === data.id
              ? { ...obj, width: data.width, height: data.height, x:data.x, y:data.y }
              : obj,
          ),
        );
      }

      if (data.type === "delete_shape") {
        setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
      }

      if (data.type === "create_shape") {
        setObjects((prev) => [...prev, data.object]);
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

    socket.send(
      JSON.stringify({
        type: "move_shape",
        id,
        x,
        y,
      }),
    );
  };

  const sendResize = (id: string, width: number, height: number, x: number, y: number) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "resize_shape",
        id,
        width,
        height,
        x,
        y
      }),
    );
  };

  const sendDelete = (id: string) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "delete_shape",
        id,
      }),
    );
  };

  const sendCreate = (object: BoardObject) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "create_shape",
        object,
      }),
    );
  };

  return { sendMove, sendDelete, sendCreate, sendResize };
}
