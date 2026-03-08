import { apiRequest } from "./client";
import type { Board } from "../types/board";

export function getBoards() {
    return apiRequest<[]>('/boards/')
}

export function createBoard(name: string) {
    return apiRequest<Board>("/boards/", {
        method: "POST",
        body: JSON.stringify({name})
    })
}

export function joinBoard(invite_code: string) {
    return apiRequest<Board>("/boards/join/", {
        method: "POST",
        body: JSON.stringify({invite_code})
    })
}

export function deleteBoard(publicId: string) {
  return apiRequest(`/boards/${publicId}/`, {
    method: "DELETE"
  })
}

export function leaveBoard(publicId: string) {
  return apiRequest(`/boards/${publicId}/leave/`, {
    method: "POST"
  })
}