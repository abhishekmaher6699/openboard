import { apiRequest } from "./client"
import type { BoardObject } from "../types/board"

export function getBoardObjects(boardId: string) {
  return apiRequest<BoardObject[]>(`/boards/${boardId}/objects/`)
}

export function createObject(
  boardId: string,
  object: Partial<BoardObject>
) {
  return apiRequest<BoardObject>(`/boards/${boardId}/objects/`, {
    method: "POST",
    body: JSON.stringify(object)
  })
}

export function updateObject(
  boardId: string,
  objectId: string,
  updates: Partial<BoardObject>
) {
  return apiRequest<BoardObject>(
    `/boards/${boardId}/objects/${objectId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(updates)
    }
  )
}

export function deleteObject(
  boardId: string,
  objectId: string
) {
  return apiRequest(
    `/boards/${boardId}/objects/${objectId}/`,
    {
      method: "DELETE"
    }
  )
}