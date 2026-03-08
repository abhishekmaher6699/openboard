export interface Owner {
    id: number
    username: string
    email: string
}

export interface Board {
    public_id: string
    id: number
    name: string
    invite_code: string
    created_at: string
    member_count: number
    owner: Owner
}

export interface BoardCardProps {
    board: Board
    currentUserId: number | null
    index?: number
    onDelete: (publicId: string) => void
    onLeave: (publicId: string) => void
    onOpen: (publicId: string) => void
}

export interface ControlProps {
    onBoardAdded: (board: Board) => void
}

export interface BoardMenuProps {
    board: Board
    currentUserId: number | null
    onDelete: (publicId: string) => void
    onLeave: (publicId: string) => void
}


// canvas

import { Viewport } from "pixi-viewport";
import { Container } from "pixi.js";

export type BoardCanvasType = {
  viewport: Viewport;
  gridLayer: Container;
  itemsLayer: Container;
  uiLayer: Container;
};

export type Shape = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: number
}