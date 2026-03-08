import { useEffect, useRef } from "react"
import type { Shape } from "../types/board"

type Props = {
  boardId: string
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
}

export default function useBoardSocket({ boardId, setShapes }: Props) {

  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {

    const socket = new WebSocket(
      `ws://localhost:8000/ws/board/${boardId}/`
    )

    socketRef.current = socket

    socket.onopen = () => {
      console.log("WS connected")
    }

    socket.onmessage = (event) => {

      const data = JSON.parse(event.data)

      if (data.type === "move_shape") {

        setShapes(prev =>
          prev.map(shape =>
            shape.id === data.id
              ? { ...shape, x: data.x, y: data.y }
              : shape
          )
        )

      }

    }

    socket.onerror = (err) => {
      console.error("WS error", err)
    }

    socket.onclose = () => {
      console.log("WS closed")
    }

    return () => socket.close()

  }, [boardId])

  const sendMove = (id: string, x: number, y: number) => {

    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify({
      type: "move_shape",
      id,
      x,
      y
    }))
  }

  return { sendMove }
}