import type { BoardObject, BoardActivity } from "../types/board"

export type MoveDiff = {
  type: "move"
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export type MoveManyDiff = {
  type: "move_many"
  moves: { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[]
}

export type ResizeDiff = {
  type: "resize"
  id: string
  from: { x: number; y: number; width: number; height: number }
  to: { x: number; y: number; width: number; height: number }
}

export type ResizeManyDiff = {
  type: "resize_many"
  resizes: { id: string; from: { x: number; y: number; width: number; height: number }; to: { x: number; y: number; width: number; height: number } }[]
}

export type CreateDiff = {
  type: "create"
  object: BoardObject
}

export type DeleteDiff = {
  type: "delete"
  object: BoardObject
}

export type DeleteManyDiff = {
  type: "delete_many"
  objects: BoardObject[]
}

export type UpdateDiff = {
  type: "update"
  id: string
  from: Record<string, any>
  to: Record<string, any>
}

export type CreateManyDiff = {
  type: "create_many"
  objects: BoardObject[]
}


export type BoardDiff =
  | MoveDiff
  | MoveManyDiff
  | ResizeDiff
  | ResizeManyDiff
  | CreateDiff
  | DeleteDiff
  | DeleteManyDiff
  | CreateManyDiff
  | UpdateDiff

export function inverse(diff: BoardDiff): BoardDiff {
  switch (diff.type) {
    case "create":
      return { type: "delete", object: diff.object }
    case "delete":
      return { type: "create", object: diff.object }
    case "delete_many":
      return { type: "create_many", objects: diff.objects }
    case "create_many":
      return { type: "delete_many", objects: diff.objects }
    case "move":
      return { type: "move", id: diff.id, from: diff.to, to: diff.from }
    case "move_many":
      return {
        type: "move_many",
        moves: diff.moves.map(m => ({ id: m.id, from: m.to, to: m.from }))
      }
    case "resize":
      return { type: "resize", id: diff.id, from: diff.to, to: diff.from }
    case "resize_many":
      return {
        type: "resize_many",
        resizes: diff.resizes.map(r => ({ id: r.id, from: r.to, to: r.from }))
      }
    case "update":
      return { type: "update", id: diff.id, from: diff.to, to: diff.from }
  }
}

export function applyDiff(objects: BoardObject[], diff: BoardDiff): BoardObject[] {
  switch (diff.type) {
    case "create":
      if (objects.some(o => o.id === diff.object.id)) return objects
      return [...objects, diff.object]

    case "delete":
      return objects.filter(o => o.id !== diff.object.id)

    case "delete_many": {
      const ids = new Set(diff.objects.map(o => o.id))
      return objects.filter(o => !ids.has(o.id))
    }

    case "move":
      return objects.map(o =>
        o.id === diff.id ? { ...o, x: diff.to.x, y: diff.to.y } : o
      )

    case "move_many":
      return objects.map(o => {
        const m = diff.moves.find(m => m.id === o.id)
        return m ? { ...o, x: m.to.x, y: m.to.y } : o
      })

    case "resize":
      return objects.map(o =>
        o.id === diff.id ? { ...o, ...diff.to } : o
      )

    case "resize_many":
      return objects.map(o => {
        const r = diff.resizes.find(r => r.id === o.id)
        return r ? { ...o, ...r.to } : o
      })

    case "update":
      return objects.map(o => {
        if (o.id !== diff.id) return o
        const newData = diff.to.data
          ? { ...o.data, ...diff.to.data }
          : o.data
        return { ...o, ...diff.to, data: newData }
      })

    case "create_many": {
        const existingIds = new Set(objects.map(o => o.id))
        const newObjects = diff.objects.filter(o => !existingIds.has(o.id))
        return [...objects, ...newObjects]
}
  }
}

export function replayToActivity(
  activities: BoardActivity[],
  targetId: string
): BoardObject[] {
  let state: BoardObject[] = [];
  for (const activity of activities) {
    if (activity.diff) {
      state = applyDiff(state, activity.diff as BoardDiff);
    }
    if (activity.id === targetId) break;
  }
  return state;
}