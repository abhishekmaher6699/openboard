import { Application } from "@pixi/react";
import { useState, useEffect } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../../lib/useBoardSocket";
import type { BoardObject } from "../../../types/board";
import { getBoardObjects } from "../../../api/board_objects";
import { createObject } from "../../../api/board_objects";

export default function PixiBoard({ boardId }: { boardId: string }) {
  const [objects, setObjects] = useState<BoardObject[]>([]);

  const createNewObject = async (x: number, y: number) => {
    const newObject = {
      type: "rectangle",
      x,
      y,
      width: 200,
      height: 120,
      data: {
        fill: "0xff0000",
      },
    };
    const created = await createObject(boardId, newObject);
    setObjects((prev) => [...prev, created]);
  };


  useEffect(() => {
    getBoardObjects(boardId).then(setObjects);
  }, [boardId]);

  const { sendMove } = useBoardSocket({ boardId, setObjects });

  const moveObject = (id: string, x: number, y: number) => {

    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, x, y } : obj)),
    );

    sendMove(id, x, y);
  };

  return (
    <Application resizeTo={window} background={0xffffff}>
      <BoardCanvas objects={objects} onCreate={createNewObject} onMove={moveObject} />
    </Application>
  );
}
