import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, memo } from "react";
import { apiRequest } from "../../../api/client";
import PixiBoard from "./PixiBoard";

const BoardPage = memo(function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [boardOwnerId, setBoardOwnerId] = useState<number | null>(null);

  useEffect(() => {
    if (!boardId) return;
    apiRequest<{ owner: { id: number } }>(`/boards/${boardId}/`)
      .then((data) => setBoardOwnerId(data.owner.id))
      .catch(() => navigate("/dashboard"));
  }, [boardId]);

  if (!boardId) return null;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <PixiBoard boardId={boardId} boardOwnerId={boardOwnerId} />
    </div>
  );
});

export default BoardPage;