export interface Owner {
  id: number
  username: string
  email: string
}

export interface BoardJoinRequest {
  id: number
  created_at: string
  user: {
    id: number
    username: string
  }
}

export interface Board {
  public_id: string
  id: number
  name: string
  invite_code: string
  created_at: string
  member_count: number
  pending_request_count: number
  pending_requests: BoardJoinRequest[]
  owner: Owner
}

export interface JoinBoardResponse {
  detail: string
  board_name: string
  public_id: string
}

export interface BoardCardProps {
  board: Board
  currentUserId: number | null
  index?: number
  onDelete: (publicId: string) => void
  onLeave: (publicId: string) => void
  onOpen: (publicId: string) => void
  onBoardUpdated: (board: Board) => void
}

export interface ControlProps {
  onBoardAdded: (board: Board) => void
}

export interface BoardMenuProps {
  board: Board
  currentUserId: number | null
  onDelete: (publicId: string) => void
  onLeave: (publicId: string) => void
  onBoardUpdated: (board: Board) => void
}
