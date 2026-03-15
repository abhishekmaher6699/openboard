import { Application } from "@pixi/react";
import { useState, useEffect } from "react";
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
  const [tool, setTool] = useState<Tool>("rectangle")
  const [color, setColor] = useState("#ff0000");
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
  } = useBoardSocket({
    boardId,
    setObjects,
  });

  const createNewObject = async (type: string, x: number, y: number) => {
    const fill = color.replace("#", "0x");
    const newObject = {
      type,
      x,
      y,
      width: 200,
      height: 120,
      data: { fill },
    };
    try {
      const created = await createObject(boardId, newObject);
      setObjects((prev) => [...prev, created]);
      sendCreate(created);
    } catch (err) {
      console.error("Create failed", err);
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

  const moveManyObjects = async (moves: { id: string; x: number; y: number }[]) => {
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

  const resizeObject = async (id: string, width: number, height: number, x: number, y: number) => {
    setObjects((prev) =>
      prev.map((obj) => obj.id === id ? { ...obj, width, height, x, y } : obj),
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

    // update React state immediately so useShapeRenderer redraws with new color
    setObjects((prev) =>
      prev.map((obj) =>
        ids.includes(obj.id) ? { ...obj, data: { ...obj.data, fill } } : obj,
      ),
    );

    try {
      await Promise.all(
        ids.map((id) => updateObject(boardId, id, { data: { fill } })),
      );
    } catch (err) {
      console.error("Color update failed", err);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) {
      updateColor(selectedIds, newColor);
    }
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
        />
      </Application>
    </>
  );
}