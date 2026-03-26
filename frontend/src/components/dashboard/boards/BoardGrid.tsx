import { useEffect, useState } from "react";
import { deleteBoard, getBoards, leaveBoard } from "../../../api/board";
import type { Board } from "../../../types/dashboard";
import { useAuth } from "../../../context/auth-context";

import Boardcard from "./BoardCard";
import BoardControls from "./BoardControls";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  bauhausFont,
  cardClass,
  sectionTitleClass,
} from "../dashboardTheme";
import useNotificationsSocket from "../../../hooks/websockets/useNotificationsSocket";

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
    setBoards((prev) => {
      const existingIndex = prev.findIndex((b) => b.public_id === board.public_id);
      if (existingIndex === -1) {
        return [board, ...prev];
      }

      return prev.map((item) =>
        item.public_id === board.public_id ? board : item,
      );
    });
  };

  const handleBoardUpdated = (board: Board) => {
    setBoards((prev) =>
      prev.map((item) => (item.public_id === board.public_id ? board : item)),
    );
  };

  useNotificationsSocket({
    enabled: Boolean(user?.id),
    onBoardsLoaded: setBoards,
    onBoardUpdated: handleBoardUpdated,
    onBoardAdded: handleBoardAdded,
  });

  const handleDelete = async (publicId: string) => {
    try {
      await deleteBoard(publicId);
      setBoards((prev) => prev.filter((b) => b.public_id !== publicId));
      toast.success("Board deleted successfully!");
    } catch {
      toast.error("Failed to delete board.");
    }
  };

  const handleLeave = async (publicId: string) => {
    try {
      await leaveBoard(publicId);
      setBoards((prev) => prev.filter((b) => b.public_id !== publicId));
      toast.success("Left board successfully!");
    } catch {
      toast.error("Failed to leave board.");
    }
  };

  const handleOpenBoard = (publicId: string) => {
    navigate(`/board/${publicId}`);
  };

  if (loading) {
    return (
      <div
        className={`mx-auto flex min-h-[13rem] max-w-3xl items-center justify-center px-5 text-center ${cardClass}`}
      >
        <p
          className="text-[0.95rem] font-black uppercase tracking-[0.12em]"
          style={bauhausFont}
        >
          Loading boards...
        </p>
      </div>
    );
  }

  if (!boards.length) {
    return (
      <div
        className={`mx-auto flex max-w-2xl flex-col items-center justify-center px-5 py-16 text-center ${cardClass}`}
      >
        <p className={sectionTitleClass} style={bauhausFont}>
          Workspace
        </p>

        <h2
          className="mt-2 text-[1.8rem] font-black uppercase leading-none tracking-[0.12em] sm:text-[2.1rem]"
          style={bauhausFont}
        >
          No Boards Yet
        </h2>

        <p className="mb-6 mt-3 max-w-md text-[0.9rem] text-[#4f4a42] dark:text-[#c8c0b0]">
          Create your first board to start collaborating.
        </p>

        <BoardControls onBoardAdded={handleBoardAdded} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-1 py-2 sm:px-2 lg:px-4">
      <div
        className={`mb-5 flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between ${cardClass}`}
      >
        <div>
          <p className={sectionTitleClass} style={bauhausFont}>
            Dashboard
          </p>
          <h2
            className="mt-1.5 text-[1.6rem] font-black uppercase leading-none tracking-[0.1em] sm:text-[1.9rem]"
            style={bauhausFont}
          >
            Your Boards
          </h2>

          <p className="mt-2 text-[0.86rem] text-[#4f4a42] dark:text-[#c8c0b0]">
            {user?.username}
          </p>
        </div>

        <BoardControls onBoardAdded={handleBoardAdded} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:gap-4 lg:gap-5">
        {boards.map((board, index) => (
          <Boardcard
            key={board.public_id}
            board={board}
            index={index}
            currentUserId={user?.id ?? null}
            onDelete={handleDelete}
            onLeave={handleLeave}
            onOpen={handleOpenBoard}
            onBoardUpdated={handleBoardUpdated}
          />
        ))}
      </div>
    </div>
  );
}
