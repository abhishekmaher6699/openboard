import { useState, useEffect } from "react"
import { apiRequest } from "../api/client"
import type { BoardActivity } from "../types/board"

export function useBoardActivity(boardId: string) {
  const [activities, setActivities] = useState<BoardActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<BoardActivity[]>(`/boards/${boardId}/activities/`)
      .then(data => {
        setActivities(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [boardId])

  const addActivity = (activity: BoardActivity) => {
    setActivities(prev => [...prev, activity].slice(-20))
  }

  return { activities, loading, addActivity }
}