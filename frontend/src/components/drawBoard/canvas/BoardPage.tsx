import { memo } from "react";
import { useParams } from "react-router-dom";
import PixiBoard from "./PixiBoard";

const BoardPage = memo(function BoardPage() {
  const { boardId } = useParams();
  if (!boardId) return null;

  return (
    <div className="w-screen h-screen overflow-hidden">
      <PixiBoard boardId={boardId} />
    </div>
  );
});

export default BoardPage;