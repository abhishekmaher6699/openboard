import { Application } from "@pixi/react";
import { useState } from "react";
import BoardCanvas from "./BoardCanvas";

export default function PixiBoard() {

  const [shapes, setShapes] = useState([
    { id: "1", x: -200, y: -200, width: 400, height: 400, color: 0xff0000 },
    { id: "2", x: -400, y: -300, width: 100, height: 50, color: 0xff0000 },

  ]);

  return (
    <Application resizeTo={window} background={0xffffff}>
      <BoardCanvas shapes={shapes} />
    </Application>
  );
}