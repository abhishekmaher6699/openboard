import { useRef } from "react";
import type { BoardObject } from "../../../types/board";
import { createObject, deleteObject as deleteObjectApi, updateObject } from "../../../api/board_objects";

type Props = {
  boardId: string;
  color: string;
  objects: BoardObject[];
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  sendUpdate: (id: string, changes: Partial<BoardObject> & { data?: Record<string, any> }) => void;
  sendManyMoves: (moves: { id: string; x: number; y: number }[]) => void;
  sendDelete: (id: string) => void;
  sendManyDelete: (ids: string[]) => void;
  sendCreate: (object: BoardObject) => void;
  sendResizeMany: (resizes: { id: string; width: number; height: number; x: number; y: number }[]) => void;
};

export function useBoardObjects({
  boardId,
  color,
  objects,
  setObjects,
  sendUpdate,
  sendManyMoves,
  sendDelete,
  sendManyDelete,
  sendCreate,
  sendResizeMany,
}: Props) {
  const objectsRef = useRef<BoardObject[]>([]);
  objectsRef.current = objects;

  const createNewObject = async (type: string, x: number, y: number): Promise<string | null> => {
    const fill = color.replace("#", "0x");
    const maxZ = Math.max(0, ...objectsRef.current.map((o) => o.z_index ?? 0));
    const defaultFill = type === "sticky" ? "0xffd700" : fill
    const newObject = {
      type, x, y,
      width: type === "sticky" ? 200 : type === "text" ? 200 : 200,
      height: type === "sticky" ? 200 : type === "text" ? 80 : 120,
      z_index: maxZ + 1000,
      data: { fill: defaultFill, text: "" },
    };
    try {
      const created = await createObject(boardId, newObject);
      setObjects((prev) => [...prev, created]);
      sendCreate(created);
      return created.id;
    } catch (err) {
      console.error("Create failed", err);
      return null;
    }
  };

  const moveObject = async (id: string, x: number, y: number) => {
    setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, x, y } : obj)));
    try {
      sendUpdate(id, { x, y });
      await updateObject(boardId, id, { x, y });
    } catch (err) { console.error("Move failed", err); }
  };

  const moveManyObjects = async (moves: { id: string; x: number; y: number }[]) => {
    setObjects((prev) => prev.map((obj) => {
      const move = moves.find((m) => m.id === obj.id);
      return move ? { ...obj, x: move.x, y: move.y } : obj;
    }));
    try {
      sendManyMoves(moves);
      await Promise.all(moves.map((m) => updateObject(boardId, m.id, { x: m.x, y: m.y })));
    } catch (err) { console.error("Move many failed", err); }
  };

  const deleteObject = async (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    try {
      await deleteObjectApi(boardId, id);
      sendDelete(id);
    } catch (err) { console.error("Delete failed", err); }
  };

  const deleteManyObjects = async (ids: string[]) => {
    setObjects((prev) => prev.filter((obj) => !ids.includes(obj.id)));
    try {
      sendManyDelete(ids);
      await Promise.all(ids.map((id) => deleteObjectApi(boardId, id)));
    } catch (err) { console.error("Delete many failed", err); }
  };

  const resizeObject = async (id: string, width: number, height: number, x: number, y: number) => {
    setObjects((prev) => prev.map((obj) => obj.id === id ? { ...obj, width, height, x, y } : obj));
    try {
      sendUpdate(id, { width, height, x, y });
      await updateObject(boardId, id, { width, height, x, y });
    } catch (err) { console.error("Resize failed", err); }
  };

  const resizeManyObjects = async (resizes: { id: string; width: number; height: number; x: number; y: number }[]) => {
    setObjects((prev) => prev.map((obj) => {
      const r = resizes.find((r) => r.id === obj.id);
      return r ? { ...obj, ...r } : obj;
    }));
    try {
      sendResizeMany(resizes);
      await Promise.all(resizes.map((r) => updateObject(boardId, r.id, { x: r.x, y: r.y, width: r.width, height: r.height })));
    } catch (err) { console.error("Resize many failed", err); }
  };

  const updateColor = async (ids: string[], newColor: string) => {
    const fill = newColor.replace("#", "0x");
    setObjects((prev) => prev.map((obj) => ids.includes(obj.id) ? { ...obj, data: { ...obj.data, fill } } : obj));
    try {
      ids.forEach(id => sendUpdate(id, { data: { fill } }));
      await Promise.all(ids.map((id) => {
        const existing = objectsRef.current.find((o) => o.id === id)?.data ?? {};
        return updateObject(boardId, id, { data: { ...existing, fill } });
      }));
    } catch (err) { console.error("Color update failed", err); }
  };

  const updateText = async (id: string, text: string) => {
    setObjects((prev) => prev.map((obj) => obj.id === id ? { ...obj, data: { ...obj.data, text } } : obj));
    try {
      sendUpdate(id, { data: { text } });
      const existing = objectsRef.current.find((o) => o.id === id)?.data ?? {};
      await updateObject(boardId, id, { data: { ...existing, text } });
    } catch (err) { console.error("Text update failed", err); }
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
  };
}