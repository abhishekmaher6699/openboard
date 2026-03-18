import { useState, useEffect } from "react"
import { apiRequest } from "../api/client"
import type { BoardActivity } from "../types/board"

const ACTIVITY_LIMIT = 50

export function useBoardActivity(boardId: string) {
  const [activities, setActivities] = useState<BoardActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<BoardActivity[]>(`/boards/${boardId}/activities/?limit=${ACTIVITY_LIMIT}`)
      .then(data => {
        setActivities(data.slice(-ACTIVITY_LIMIT))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [boardId])

  const addActivity = (activity: BoardActivity) => {
    setActivities(prev => {
      if (prev.some(a => a.id === activity.id)) return prev
      return [...prev, activity].slice(-ACTIVITY_LIMIT)
    })
  }

  return { activities, loading, addActivity }
}