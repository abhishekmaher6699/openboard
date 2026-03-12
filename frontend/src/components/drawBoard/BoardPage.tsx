import { useParams } from "react-router-dom";
import PixiBoard from "./PixiBoard";

export default function BoardPage() {
  const { boardId } = useParams();

  if (!boardId) return null;

  return (
    <div className="w-screen h-screen overflow-hidden">
      <PixiBoard boardId={boardId} />
    </div>
  );
}