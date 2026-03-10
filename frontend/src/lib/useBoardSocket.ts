import { useEffect, useRef } from "react"
import type { BoardObject } from "../types/board"

type Props = {
  boardId: string
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>
}

export default function useBoardSocket({ boardId, setObjects }: Props) {

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

        setObjects(prev =>
          prev.map(obj =>
            obj.id === data.id
              ? { ...obj, x: data.x, y: data.y }
              : obj
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