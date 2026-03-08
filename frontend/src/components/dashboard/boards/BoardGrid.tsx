import { useEffect, useState } from "react";
import { deleteBoard, getBoards, leaveBoard } from "../../../api/board";
import type { Board } from "../../../types/board";
import { useAuth } from "../../../context/auth-context";

import Boardcard from "./BoardCard";
import BoardControls from "./BoardControls";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";



export default function BoardGrid() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await getBoards();
        setBoards(data);
      } catch (err) {
        console.error("Failed to fetch boards", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleBoardAdded = (board: Board) => {
    setBoards((prev) => [board, ...prev]);
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteBoard(publicId);
      setBoards((prev) => prev.filter((b) => b.public_id !== publicId));
      toast.success("Board deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete board.");
    }
  };

  const handleLeave = async (publicId: string) => {
    try {
      await leaveBoard(publicId);
      setBoards((prev) => prev.filter((b) => b.public_id !== publicId));
      toast.success("Left board successfully!");
    } catch (err) {
      toast.error("Failed to leave board.");
    }
  };

  const handleOpenBoard = (publicId: string) => {
    navigate(`/board/${publicId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading boards...
      </div>
    );
  }

  if (!boards.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-lg font-semibold mb-2">No boards yet</h2>

        <p className="text-sm text-muted-foreground mb-6">
          Create your first board to start collaborating.
        </p>

        <BoardControls onBoardAdded={handleBoardAdded} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
    <div className=" flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your Boards</h2>

          <p className="text-sm text-muted-foreground mt-1">{user?.username}</p>
        </div>

        <BoardControls onBoardAdded={handleBoardAdded} />
      </div>

     <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 sm:gap-6 lg:gap-7">
        {boards.map((board, index) => (
          <Boardcard
            key={board.public_id}
            board={board}
            index={index}
            currentUserId={user?.id ?? null}
            onDelete={handleDelete}
            onLeave={handleLeave}
            onOpen={handleOpenBoard}
          />
        ))}
      </div>
    </div>
  );
}
