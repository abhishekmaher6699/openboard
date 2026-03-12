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
import { Graphics } from "pixi.js"

export type BoardCanvasType = {
  viewport: Viewport;
  gridLayer: Container;
  itemsLayer: Container;
  uiLayer: Container;
};

export type BoardCanvasProps = {
   objects: BoardObject[]
    tool: "rectangle" | "circle" | "sticky"
    onMove: (id: string, x: number, y: number) => void
    onCreate: (type: any, x: number, y: number) => void
    onDelete: (id: string) => void
    onResize: (id: string, width: number, height: number, x: number, y: number) => void
};

export type BoardObject = {
  id: string
  type: string

  x: number
  y: number

  width?: number
  height?: number

  rotation?: number
  z_index?: number

  data: Record<string, any>
}


export type useResizeProps = {
  viewportRef: React.RefObject<any>
  selectedRef: React.RefObject<string | null>
  selectionRef: React.RefObject<any>
  graphicsMapRef: React.RefObject<Map<string, any>>
  onResize: (id: string, width: number, height: number, x: number, y: number) => void
  drawSelectionRef: React.RefObject<(obj: any) => void>
}

export type ResizeHandle = "nw" | "ne" | "se" | "sw"

export type ActiveResize = {
  id: string
  handle: ResizeHandle
  startX: number
  startY: number
  startObjX: number
  startObjY: number
  startWidth: number
  startHeight: number
  graphics: any
  type: string
}


export type UseShapeRendererProps = {
  objects: BoardObject[]
  viewportRef: React.RefObject<any>
  itemsLayerRef: React.RefObject<any>
  selectedRef: React.RefObject<string | null>
  selectionRef: React.RefObject<any>
  activeDragRef: React.RefObject<any>
  graphicsMapRef: React.RefObject<Map<string, Graphics>>
  drawSelection: (obj: BoardObject) => void
}

