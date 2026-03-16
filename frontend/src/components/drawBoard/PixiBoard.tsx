import { Application } from "@pixi/react";
import { useState, useEffect, useRef } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../lib/useBoardSocket";
import type { BoardObject, Tool } from "../../types/board";
import { getBoardObjects } from "../../api/board_objects";
import {
  createObject,
  deleteObject as deleteObjectApi,
  updateObject,
} from "../../api/board_objects";
import BoardControls from "./features/BoardControls";

export default function PixiBoard({ boardId }: { boardId: string }) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#ff0000");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // keep a ref of objects so callbacks always have latest data without stale closure
  const objectsRef = useRef<BoardObject[]>([]);
  objectsRef.current = objects;

  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const {
    sendMove,
    sendManyMoves,
    sendDelete,
    sendManyDelete,
    sendCreate,
    sendResize,
    sendColorUpdate,
    sendTextUpdate,
  } = useBoardSocket({ boardId, setObjects });

  const createNewObject = async (
    type: string,
    x: number,
    y: number,
  ): Promise<string | null> => {
    const fill = color.replace("#", "0x");
    const newObject = {
      type,
      x,
      y,
      width: type === "text" ? 200 : 200,
      height: type === "text" ? 80 : 120,
      data: { fill, text: "" },
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
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, x, y } : obj)),
    );
    try {
      sendMove(id, x, y);
      await updateObject(boardId, id, { x, y });
    } catch (err) {
      console.error("Move failed", err);
    }
  };

  const moveManyObjects = async (
    moves: { id: string; x: number; y: number }[],
  ) => {
    setObjects((prev) =>
      prev.map((obj) => {
        const move = moves.find((m) => m.id === obj.id);
        return move ? { ...obj, x: move.x, y: move.y } : obj;
      }),
    );
    try {
      sendManyMoves(moves);
      await Promise.all(
        moves.map((m) => updateObject(boardId, m.id, { x: m.x, y: m.y })),
      );
    } catch (err) {
      console.error("Move many failed", err);
    }
  };

  const deleteObject = async (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    try {
      await deleteObjectApi(boardId, id);
      sendDelete(id);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const deleteManyObjects = async (ids: string[]) => {
    setObjects((prev) => prev.filter((obj) => !ids.includes(obj.id)));
    try {
      sendManyDelete(ids);
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
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id ? { ...obj, width, height, x, y } : obj,
      ),
    );
    try {
      sendResize(id, width, height, x, y);
      await updateObject(boardId, id, { width, height, x, y });
    } catch (err) {
      console.error("Resize failed", err);
    }
  };

  const updateColor = async (ids: string[], newColor: string) => {
    const fill = newColor.replace("#", "0x");
    setObjects((prev) =>
      prev.map((obj) =>
        ids.includes(obj.id) ? { ...obj, data: { ...obj.data, fill } } : obj,
      ),
    );
    try {
      sendColorUpdate(ids, fill);
      await Promise.all(
        ids.map((id) => {
          // merge with existing data so text isn't wiped
          const existing =
            objectsRef.current.find((o) => o.id === id)?.data ?? {};
          return updateObject(boardId, id, { data: { ...existing, fill } });
        }),
      );
    } catch (err) {
      console.error("Color update failed", err);
    }
  };

  const updateText = async (id: string, text: string) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id ? { ...obj, data: { ...obj.data, text } } : obj,
      ),
    );
    try {
      sendTextUpdate(id, text);
      // merge with existing data so fill isn't wiped
      const existing = objectsRef.current.find((o) => o.id === id)?.data ?? {};
      await updateObject(boardId, id, { data: { ...existing, text } });
    } catch (err) {
      console.error("Text update failed", err);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) updateColor(selectedIds, newColor);
  };

  return (
    <>
      <BoardControls
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={handleColorChange}
      />
      <Application
        resizeTo={window}
        background={0xffffff}
        antialias
        resolution={window.devicePixelRatio}
        autoDensity
      >
        <BoardCanvas
          objects={objects}
          tool={tool}
          setTool={setTool}
          onCreate={createNewObject}
          onMove={moveObject}
          onDelete={deleteObject}
          onManyDelete={deleteManyObjects}
          onResize={resizeObject}
          onManyMove={moveManyObjects}
          onSelectionChange={setSelectedIds}
          onTextChange={updateText}
        />
      </Application>
    </>
  );
}
