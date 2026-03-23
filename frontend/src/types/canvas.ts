import { Viewport } from "pixi-viewport"
import { Container, Graphics } from "pixi.js"
import React from "react"
import type { Tool, BoardObject } from "./board"
import type { BoardDiff } from "../lib/diffUtils"

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
  onLineUpdate: (id: string, x1: number, y1: number, x2: number, y2: number) => void
  viewportRef?: React.RefObject<any>
  objectMapRef?: React.RefObject<Map<string, BoardObject>>
  clearSelectionRef?: React.RefObject<() => void>
  previewMode?: boolean
  color: string
  strokeWidth: number
  selectedIds: string[]
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
export type ObjectSnapshot = {
  obj: BoardObject
  graphics: Graphics
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

export type UseResizeProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onResize: (id: string, w: number, h: number, x: number, y: number) => void
  onResizeMany: (resizes: { id: string; width: number; height: number; x: number; y: number }[]) => void
  drawSelectionRef: React.RefObject<DrawSelectionFn>
  disabled: boolean | undefined
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
  tool: Tool
  onTextOpen: (id: string) => void
  onTextCreate: (x: number, y: number) => void;
  disabled: boolean | undefined
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
  previewMode?: boolean
  toolRef: React.RefObject<Tool>
  disabled: boolean | undefined
}

export type UseMarqueeProps = {
  viewportRef: React.RefObject<any>
  overlayLayerRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectsRef: React.RefObject<BoardObject[]>
  drawSelectionRef: React.RefObject<DrawSelectionFn>
  disabled: boolean | undefined
}

export type UseDragProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<BoardInteraction>
  objectsRef: React.RefObject<BoardObject[]>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onMove: (id: string, x: number, y: number) => void
  onManyMove: (moves: { id: string; x: number; y: number }[]) => void
  drawSelectionRef: React.RefObject<DrawSelectionFn>
  disabled: boolean | undefined
}

export type UseCreateProps = {
  viewportRef: React.RefObject<any>
  tool: string
  interactionRef: React.RefObject<BoardInteraction>
  onCreate: (type: string, x: number, y: number) => Promise<string | null>
  onToolChange?: (tool: Tool) => void
  onTextCreate?: (x: number, y: number) => void
  disabled: boolean | undefined
}

export type UseDeleteProps = {
  interactionRef: React.RefObject<BoardInteraction>
  onDelete: (id: string) => void
  onManyDelete: (ids: string[]) => void
  disabled: boolean | undefined
  clearSelectionRef?: React.RefObject<() => void>
  hideToolbar?: () => void
}

export type UseTextEditProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<any>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onTextChange: (id: string, text: string) => void
  onToolChange: (tool: any) => void
  disabled: boolean | undefined
}

export type UseUndoRedoProps = {
  onUndo: () => void;
  onRedo: () => void;
};

export type ToolbarState = {
  visible: boolean
  x: number
  y: number
  ids: string[]
  types: string[]
}

export type UseBoardToolbarProps = {
  boardId: string;
  selectedIds: string[];
  objectsRef: React.RefObject<BoardObject[]>;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  createNewObject: (
    type: string,
    x: number,
    y: number,
  ) => Promise<string | null>;
  sendCreate: (object: BoardObject, diff: BoardDiff) => void;
  sendUpdate: (
    id: string,
    changes: any,
    actionType?: string,
    diff?: BoardDiff,
  ) => void;
  sendUpdateMany: (
    updates: { id: string; changes: Record<string, any> }[],
    actionType: string,
    diff: BoardDiff,
  ) => void;
  deleteObject: (id: string) => void;
  deleteManyObjects: (ids: string[]) => void;
  clearSelectionRef: React.RefObject<() => void>;
  hideToolbar: () => void;
  updateStrokeWidth: (ids: string[], strokeWidth: number, prevStrokeWidth: number) => Promise<void>;
};

export type FloatingToolBarProps = {
  toolbar: ToolbarState
  objects: BoardObject[]
  onDelete: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBack: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onBold: () => void
  onItalic: () => void
  onFontSize: (size: number) => void
  onAlign: (align: "left" | "center" | "right") => void
  onFontFamily: (font: string) => void
  onTextColor: (color: string) => void
  onStrokeWidth: (width: number, prevWidth: number) => void;
  onStrokeWidthPreview: (width: number) => void;


}