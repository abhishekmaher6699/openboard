import { apiRequest } from "./client";
import type { Board, JoinBoardResponse } from "../types/dashboard";

export function getBoards() {
    return apiRequest<Board[]>('/boards/')
}

export function createBoard(name: string) {
    return apiRequest<Board>("/boards/", {
        method: "POST",
        body: JSON.stringify({name})
    })
}

export function joinBoard(invite_code: string) {
    return apiRequest<JoinBoardResponse>("/boards/join/", {
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

export function kickMember(publicId: string, userId: number) {
  return apiRequest(`/boards/${publicId}/kick/${userId}/`, {
    method: "POST",
  });
}

export function approveJoinRequest(publicId: string, userId: number) {
  return apiRequest<Board>(`/boards/${publicId}/approve/${userId}/`, {
    method: "POST",
  });
}

export function rejectJoinRequest(publicId: string, userId: number) {
  return apiRequest<Board>(`/boards/${publicId}/reject/${userId}/`, {
    method: "POST",
  });
}
