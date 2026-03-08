import { Application } from "@pixi/react";
import { useState } from "react";
import BoardCanvas from "./BoardCanvas";
import useBoardSocket from "../../../lib/useBoardSocket";

export default function PixiBoard({ boardId }: { boardId: string }) {

  const [shapes, setShapes] = useState([
    { id: "1", x: -200, y: -200, width: 400, height: 400, color: 0xff0000 },
    { id: "2", x: -400, y: -300, width: 100, height: 50, color: 0xff0000 },

  ]);

  const {sendMove} = useBoardSocket({ boardId, setShapes })

  const moveShape = (id: string, x: number, y: number) => {

    // optimistic update
    setShapes(prev =>
      prev.map(shape =>
        shape.id === id
          ? { ...shape, x, y }
          : shape
      )
    )

    sendMove(id, x, y)
  }
  
  return (
    <Application resizeTo={window} background={0xffffff}>
      <BoardCanvas shapes={shapes} onMove={moveShape} />
    </Application>
  );
}