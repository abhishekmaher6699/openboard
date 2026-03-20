export type Tool =
  | "select"
  | "rectangle"
  | "circle"
  | "sticky"
  | "triangle"
  | "diamond"
  | "text"
  | "pen"

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

export type BoardActivity = {
  id: string
  user: { id: number; username: string } | null
  action_type: string
  payload: Record<string, any>
  snapshot: BoardObject[]
  diff: Record<string, any> | null
  created_at: string
  sequence: number
}

export type UseBoardSocketProps = {
  boardId: string;
  objectsRef: React.RefObject<BoardObject[]>;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  onActivity?: (activity: BoardActivity, deletedIds?: string[]) => void;
  onRestore?: (snapshot: BoardObject[], deletedIds: string[]) => void;
  onUndoApplied?: (cursorSequence: number, userId: number) => void;
  onRedoApplied?: (cursorSequence: number, userId: number) => void;
  onChatMessage?: (msg: ChatMessage) => void;
  onReaction?: (messageId: string, emoji: string, userId: number) => void;
};

import type { BoardDiff } from "../lib/diffUtils"

export type UseBoardObjectsProps = {
  boardId: string;
  color: string;
  objects: BoardObject[];
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  sendUpdate: (
    id: string,
    changes: Partial<BoardObject> & { data?: Record<string, any> },
    actionType?: string,
    diff?: BoardDiff,
  ) => void;
  sendUpdateMany: (updates: { id: string; changes: Record<string, any> }[], actionType: string, diff: BoardDiff) => void;
  sendManyMoves: (
    moves: { id: string; x: number; y: number }[],
    diff: BoardDiff,
  ) => void;
  sendDelete: (id: string, diff: BoardDiff) => void;
  sendManyDelete: (ids: string[], diff: BoardDiff) => void;
  sendCreate: (object: BoardObject, diff: BoardDiff) => void;
  sendResizeMany: (
    resizes: {
      id: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }[],
    diff: BoardDiff,
  ) => void;
};

export type TextColorPickerProps = {
  value: string
  onChange: (color: string) => void
}

export type BoardControlsProps = {
  tool: Tool;
  setTool: React.Dispatch<React.SetStateAction<Tool>>;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onToggleActivity: () => void;
  activityOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export type ActivityPanelProps = {
  activities: BoardActivity[];
  loading: boolean;
  ready: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (snapshot: BoardObject[], label: string, sequence: number) => void;
  onRestore: (snapshot: BoardObject[], sequence: number) => void;
  activeSnapshot: BoardObject[] | null;
  currentActivityId: string | null;
  exitPreview: () => void;
  objects: BoardObject[];
};


export type PreviewBannerProps = {
  label: string
  onRestore: () => void
  onExit: () => void
}