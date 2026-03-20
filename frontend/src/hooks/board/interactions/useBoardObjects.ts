import { useRef } from "react";
import type { BoardObject } from "../../../types/board";
import type { BoardDiff } from "../../../lib/diffUtils";
import {
  createObject,
  deleteObject as deleteObjectApi,
  updateObject,
} from "../../../api/boardObjects";

import type { UseBoardObjectsProps } from "../../../types/board";

export function useBoardObjects({
  boardId,
  color,
  objects,
  setObjects,
  sendUpdate,
  sendUpdateMany,
  sendManyMoves,
  sendDelete,
  sendManyDelete,
  sendCreate,
  sendResizeMany,
}: UseBoardObjectsProps) {
  const objectsRef = useRef<BoardObject[]>([]);
  objectsRef.current = objects;

  const createNewObject = async (
    type: string,
    x: number,
    y: number,
    extraData?: Record<string, any>,
  ): Promise<string | null> => {
    const fill = color.replace("#", "0x");
    const maxZ = Math.max(0, ...objectsRef.current.map((o) => o.z_index ?? 0));
    const defaultFill = type === "sticky" ? "0xffd700" : fill;

    const newObject = {
      type,
      x,
      y,
      width: extraData?.width ?? (type === "text" ? 200 : 200),
      height: extraData?.height ?? (type === "text" ? 80 : 120),
      z_index: maxZ + 1000,
      data: extraData ?? { fill: defaultFill, text: "" },
    };
    try {
      const created = await createObject(boardId, newObject);
      setObjects((prev) => [...prev, created]);
      sendCreate(created, { type: "create", object: created });
      return created.id;
    } catch (err) {
      console.error("Create failed", err);
      return null;
    }
  };

  const moveObject = async (id: string, x: number, y: number) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj) return;
    // capture where it was before moving
    const diff: BoardDiff = {
      type: "move",
      id,
      from: { x: obj.x, y: obj.y },
      to: { x, y },
    };
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
    try {
      sendUpdate(id, { x, y }, "move_shape", diff);
      updateObject(boardId, id, { x, y });
    } catch (err) {
      console.error("Move failed", err);
    }
  };

  const moveManyObjects = async (
    moves: { id: string; x: number; y: number }[],
  ) => {
    // capture all previous positions
    const diff: BoardDiff = {
      type: "move_many",
      moves: moves.map((m) => {
        const obj = objectsRef.current.find((o) => o.id === m.id);
        return {
          id: m.id,
          from: { x: obj?.x ?? 0, y: obj?.y ?? 0 },
          to: { x: m.x, y: m.y },
        };
      }),
    };
    setObjects((prev) =>
      prev.map((obj) => {
        const move = moves.find((m) => m.id === obj.id);
        return move ? { ...obj, x: move.x, y: move.y } : obj;
      }),
    );
    try {
      sendManyMoves(moves, diff);
      Promise.all(
        moves.map((m) => updateObject(boardId, m.id, { x: m.x, y: m.y })),
      );
    } catch (err) {
      console.error("Move many failed", err);
    }
  };

  const deleteObject = async (id: string) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj) return;
    // capture the full object so we can restore it on undo
    const diff: BoardDiff = { type: "delete", object: obj };
    setObjects((prev) => prev.filter((o) => o.id !== id));
    try {
      await deleteObjectApi(boardId, id);
      sendDelete(id, diff);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const deleteManyObjects = async (ids: string[]) => {
    const deletedObjects = objectsRef.current.filter((o) => ids.includes(o.id));
    // capture all deleted objects so we can restore them on undo
    const diff: BoardDiff = { type: "delete_many", objects: deletedObjects };
    setObjects((prev) => prev.filter((obj) => !ids.includes(obj.id)));
    try {
      sendManyDelete(ids, diff);
      await Promise.all(ids.map((id) => deleteObjectApi(boardId, id)));
    } catch (err) {
      console.error("Delete many failed", err);
    }
  };

  const resizeObject = async (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj) return;
    const diff: BoardDiff = {
      type: "resize",
      id,
      from: {
        x: obj.x,
        y: obj.y,
        width: obj.width ?? 200,
        height: obj.height ?? 120,
      },
      to: { x, y, width, height },
    };
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, width, height, x, y } : o)),
    );
    try {
      sendUpdate(id, { width, height, x, y }, "resize_shape", diff);
      updateObject(boardId, id, { width, height, x, y });
    } catch (err) {
      console.error("Resize failed", err);
    }
  };

  const resizeManyObjects = async (
    resizes: {
      id: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }[],
  ) => {
    const diff: BoardDiff = {
      type: "resize_many",
      resizes: resizes.map((r) => {
        const obj = objectsRef.current.find((o) => o.id === r.id);
        return {
          id: r.id,
          from: {
            x: obj?.x ?? 0,
            y: obj?.y ?? 0,
            width: obj?.width ?? 200,
            height: obj?.height ?? 120,
          },
          to: { x: r.x, y: r.y, width: r.width, height: r.height },
        };
      }),
    };
    setObjects((prev) =>
      prev.map((obj) => {
        const r = resizes.find((r) => r.id === obj.id);
        return r ? { ...obj, ...r } : obj;
      }),
    );
    try {
      sendResizeMany(resizes, diff);
      Promise.all(
        resizes.map((r) =>
          updateObject(boardId, r.id, {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          }),
        ),
      );
    } catch (err) {
      console.error("Resize many failed", err);
    }
  };

  const updateColor = async (ids: string[], newColor: string) => {
    const fill = newColor.replace("#", "0x");
    const updates = ids.map((id) => {
      const obj = objectsRef.current.find((o) => o.id === id);
      return {
        id,
        from: { data: { fill: obj?.data?.fill } },
        to: { data: { fill } },
        changes: { data: { fill } },
      };
    });

    const diff: BoardDiff = {
      type: "update_many",
      updates: updates.map((u) => ({ id: u.id, from: u.from, to: u.to })),
    };

    sendUpdateMany(
      updates.map((u) => ({ id: u.id, changes: u.changes })),
      "update_color_many",
      diff,
    );

    setObjects((prev) =>
      prev.map((obj) =>
        ids.includes(obj.id) ? { ...obj, data: { ...obj.data, fill } } : obj,
      ),
    );

    try {
      Promise.all(
        ids.map((id) => {
          const existing =
            objectsRef.current.find((o) => o.id === id)?.data ?? {};
          console.log("saving data:", { ...existing, fill });
          return updateObject(boardId, id, { data: { ...existing, fill } });
        }),
      );
    } catch (err) {
      console.error("Color update failed", err);
    }
  };

  const updateText = async (id: string, text: string) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    // capture previous text value
    const diff: BoardDiff = {
      type: "update",
      id,
      from: { data: { text: obj?.data?.text ?? "" } },
      to: { data: { text } },
    };
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, data: { ...o.data, text } } : o)),
    );
    try {
      sendUpdate(id, { data: { text } }, "update_text", diff);
      const existing = objectsRef.current.find((o) => o.id === id)?.data ?? {};
      await updateObject(boardId, id, { data: { ...existing, text } });
    } catch (err) {
      console.error("Text update failed", err);
    }
  };

  const updateStrokeWidth = async (
    ids: string[],
    strokeWidth: number,
    prevStrokeWidth: number,
  ) => {

    console.log("updateStrokeWidth called", { ids, strokeWidth, prevStrokeWidth });

    const snapshots = ids.map((id) => ({
      id,
      existing: objectsRef.current.find((o) => o.id === id)?.data ?? {},
      prevStrokeWidth, // use the passed-in value, not from ref
    }));

    setObjects((prev) =>
      prev.map((obj) =>
        ids.includes(obj.id)
          ? { ...obj, data: { ...obj.data, strokeWidth } }
          : obj,
      ),
    );

    if (ids.length === 1) {
      const { id } = snapshots[0];
      sendUpdate(id, { data: { strokeWidth } }, "update_object", {
        type: "update",
        id,
        from: { data: { strokeWidth: prevStrokeWidth } },
        to: { data: { strokeWidth } },
      });
    } else {
      const diff: BoardDiff = {
        type: "update_many",
        updates: snapshots.map(({ id }) => ({
          id,
          from: { data: { strokeWidth: prevStrokeWidth } },
          to: { data: { strokeWidth } },
        })),
      };
      sendUpdateMany(
        snapshots.map(({ id }) => ({ id, changes: { data: { strokeWidth } } })),
        "update_object_many",
        diff,
      );
    }

    try {
      await Promise.all(
        snapshots.map(({ id, existing }) =>
          updateObject(boardId, id, { data: { ...existing, strokeWidth } }),
        ),
      );
    } catch (err) {
      console.error("Stroke width update failed", err);
    }
  };
  return {
    objectsRef,
    createNewObject,
    moveObject,
    moveManyObjects,
    deleteObject,
    deleteManyObjects,
    resizeObject,
    resizeManyObjects,
    updateColor,
    updateText,
    updateStrokeWidth,
  };
}
