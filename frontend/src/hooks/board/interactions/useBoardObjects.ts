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
    console.log("Create new object called");
    const fill = color.replace("#", "0x");
    const maxZ = Math.max(0, ...objectsRef.current.map((o) => o.z_index ?? 0));
    const defaultFill = type === "sticky" ? "0xffd700" : fill;

    const isLine = type === "line";

    const newObject = {
      type,
      x: isLine ? x : x,
      y: isLine ? y : y,
      width: isLine ? 200 : (extraData?.width ?? (type === "text" ? 200 : 200)),
      height: isLine ? 4 : (extraData?.height ?? (type === "text" ? 80 : 120)),
      z_index: maxZ + 1000,
      data: isLine
        ? { x1: 0, y1: 0, x2: 200, y2: 0, strokeWidth: 3, fill: fill }
        : (extraData ?? { fill: defaultFill, text: "" }),
    };
    try {
      const created = await createObject(boardId, newObject);
      setObjects((prev) => [...prev, created]);
      sendCreate(created, { type: "create", object: created });
      console.log("created: ", created);

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
        if (!r) return obj;

        if (obj.type === "line") {
          const origX1 = obj.data?.x1 ?? 0;
          const origY1 = obj.data?.y1 ?? 0;
          const origX2 = obj.data?.x2 ?? 200;
          const origY2 = obj.data?.y2 ?? 0;

          const origSpanX = origX2 - origX1; // actual span, not obj.width
          const origSpanY = origY2 - origY1;

          const scaleX = r.width / (Math.abs(origSpanX) || 1);
          const scaleY = r.height / (Math.abs(origSpanY) || 1);

          // preserve direction (sign) when scaling
          return {
            ...obj,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            data: {
              ...obj.data,
              x1: origX1 < origX2 ? 0 : r.width,
              y1: origY1 < origY2 ? 0 : r.height,
              x2: origX1 < origX2 ? r.width : 0,
              y2: origY1 < origY2 ? r.height : 0,
            },
          };
        }

        return { ...obj, ...r };
      }),
    );

    try {
      sendResizeMany(resizes, diff);
      Promise.all(
        resizes.map((r) => {
          const obj = objectsRef.current.find((o) => o.id === r.id);
          if (obj?.type === "line") {
            const scaleX = r.width / (obj.width || 1);
            const scaleY = r.height / (obj.height || 1);
            return updateObject(boardId, r.id, {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              data: {
                ...obj.data,
                x1: (obj.data?.x1 ?? 0) * scaleX,
                y1: (obj.data?.y1 ?? 0) * scaleY,
                x2: (obj.data?.x2 ?? obj.width) * scaleX,
                y2: (obj.data?.y2 ?? 0) * scaleY,
              },
            });
          }
          return updateObject(boardId, r.id, {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          });
        }),
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
    console.log("updateStrokeWidth called", {
      ids,
      strokeWidth,
      prevStrokeWidth,
    });

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

  const updateLine = async (
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj) return;

    const diff: BoardDiff = {
      type: "update",
      id,
      from: {
        data: {
          x1: obj.data?.x1,
          y1: obj.data?.y1,
          x2: obj.data?.x2,
          y2: obj.data?.y2,
        },
      },
      to: { data: { x1, y1, x2, y2 } },
    };

    setObjects((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, data: { ...o.data, x1, y1, x2, y2 } } : o,
      ),
    );

    sendUpdate(id, { data: { x1, y1, x2, y2 } }, "update_object", diff);
    await updateObject(boardId, id, { data: { ...obj.data, x1, y1, x2, y2 } });
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
    updateLine,
  };
}
