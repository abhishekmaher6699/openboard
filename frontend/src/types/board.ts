import { Viewport } from "pixi-viewport"
import { Container, Graphics } from "pixi.js"
import React from "react"

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

export type Tool =
  | "select"
  | "rectangle"
  | "circle"
  | "sticky"
  | "triangle"
  | "diamond"
  | "text"

export interface ControlProps {
  onBoardAdded: (board: Board) => void
}

export interface BoardMenuProps {
  board: Board
  currentUserId: number | null
  onDelete: (publicId: string) => void
  onLeave: (publicId: string) => void
}

export type BoardCanvasType = {
  viewport: Viewport
  gridLayer: Container
  itemsLayer: Container
  uiLayer: Container
}

export type BoardCanvasProps = {
  objects: BoardObject[]
  tool: Tool
  setTool: React.Dispatch<React.SetStateAction<Tool>>
  onMove: (id: string, x: number, y: number) => void
  onCreate: (type: string, x: number, y: number) => Promise<string | null>
  onDelete: (id: string) => void
  onManyDelete: (ids: string[]) => void
  onResize: (id: string, width: number, height: number, x: number, y: number) => void
  onManyMove: (moves: { id: string; x: number; y: number }[]) => void
  onSelectionChange?: (ids: string[]) => void
  onTextChange: (id: string, text: string) => void
  onResizeMany: (resizes: { id: string; width: number; height: number; x: number; y: number }[]) => void
  onToolbarUpdate?: (ids: Set<string>, overrides?: SelectionOverrides) => void
  viewportRef?: React.RefObject<any>
  objectMapRef?: React.RefObject<Map<string, BoardObject>>
  clearSelectionRef?: React.RefObject<() => void>
}

export type BoardObject = {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  z_index?: number
  data: Record<string, any>
}

export type BoardInteraction = {
  selected: Set<string>
  activeDrag: any
  activeResize: any
  graphicsMap: Map<string, any>
  selectionGraphics: any
  selectionOutline: any
  isMarqueeActive: boolean
  isGroupDrag: boolean
  isEditing: boolean
}

export type SelectionOverrides = Map<string, { x: number; y: number; width: number; height: number }>
export type DrawSelectionFn = (ids: Set<string>, overrides?: SelectionOverrides) => void

export type UseResizeProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onResize: (id: string, w: number, h: number, x: number, y: number) => void
  onResizeMany: (resizes: { id: string; width: number; height: number; x: number; y: number }[]) => void
  drawSelectionRef: React.RefObject<DrawSelectionFn>
}

export type ResizeHandle = "nw" | "ne" | "se" | "sw"

export type ActiveResize = {
  handle: ResizeHandle
  startX: number
  startY: number
  groupX: number
  groupY: number
  groupWidth: number
  groupHeight: number
  objectSnapshots: Map<string, ObjectSnapshot>
}

export type UseShapeRendererProps = {
  objects: BoardObject[]
  viewportRef: React.RefObject<any>
  itemsLayerRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectsRef: React.RefObject<BoardObject[]>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  drawSelectionRef: React.RefObject<DrawSelectionFn>
  toolRef: React.RefObject<Tool>
  onTextOpen: (id: string) => void
}

export type UseSelectionProps = {
  overlayLayerRef: React.RefObject<any>
  viewportRef: React.RefObject<any>
  attachHandles?: (container: any, obj: any) => void
  objectsRef: React.RefObject<BoardObject[]>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  interactionRef: React.RefObject<BoardInteraction>
  onSelectionChange?: (ids: string[]) => void
  onToolbarUpdate?: (ids: Set<string>, overrides?: SelectionOverrides) => void
  clearSelectionRef?: React.RefObject<() => void>
}

export type UseMarqueeProps = {
  viewportRef: React.RefObject<any>
  overlayLayerRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectsRef: React.RefObject<BoardObject[]>
  drawSelectionRef: React.RefObject<DrawSelectionFn>
}

export type UseDragProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectsRef: React.RefObject<BoardObject[]>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onMove: (id: string, x: number, y: number) => void
  onManyMove: (moves: { id: string; x: number; y: number }[]) => void
  drawSelectionRef: React.RefObject<DrawSelectionFn>
}

export type UseCreateProps = {
  viewportRef: React.RefObject<any>
   interactionRef: React.RefObject<BoardInteraction>
  tool: string
  onCreate: (type: string, x: number, y: number) => Promise<string | null>
  onToolChange?: (tool: Tool) => void
  onTextCreate?: (x: number, y: number) => void
}

export type UseDeleteProps = {
  interactionRef: React.RefObject<BoardInteraction>
  onDelete: (id: string) => void
  onManyDelete: (ids: string[]) => void
}

export type UseTextEditProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onTextChange: (id: string, text: string) => void
  onToolChange: (tool: Tool) => void
}

export type ObjectSnapshot = {
  obj: BoardObject
  graphics: Graphics
}