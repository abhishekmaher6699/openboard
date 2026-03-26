import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getValidToken } from "../../api/client";
import { getBoards } from "../../api/board";
import type { Board } from "../../types/dashboard";

type UseNotificationsSocketProps = {
  enabled: boolean;
  onBoardsLoaded: (boards: Board[]) => void;
  onBoardUpdated: (board: Board) => void;
  onBoardAdded: (board: Board) => void;
};

export default function useNotificationsSocket({
  enabled,
  onBoardsLoaded,
  onBoardUpdated,
  onBoardAdded,
}: UseNotificationsSocketProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const connectingRef = useRef(false);

  const onBoardsLoadedRef = useRef(onBoardsLoaded);
  const onBoardUpdatedRef = useRef(onBoardUpdated);
  const onBoardAddedRef = useRef(onBoardAdded);

  onBoardsLoadedRef.current = onBoardsLoaded;
  onBoardUpdatedRef.current = onBoardUpdated;
  onBoardAddedRef.current = onBoardAdded;

  useEffect(() => {
    if (!enabled) return;

    const syncBoards = async (delayMs = 0) => {
      if (delayMs) await new Promise((res) => setTimeout(res, delayMs));
      try {
        const boards = await getBoards();
        onBoardsLoadedRef.current(boards);
      } catch (err) {
        console.error("Failed to refresh boards from notifications socket", err);
      }
    };

    const syncOrUpdateBoard = (board?: Board) => {
      if (board) {
        onBoardUpdatedRef.current(board);
        return;
      }
      void syncBoards();
    };

    const connect = async () => {
      if (unmountedRef.current || connectingRef.current) return;

      if (socketRef.current) {
        const state = socketRef.current.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
      }

      connectingRef.current = true;

      const token = getValidToken();
      if (!token) {
        connectingRef.current = false;
        return;
      }

      const socket = new WebSocket(
        `ws://${window.location.hostname}:8000/ws/notifications/?token=${token}`,
      );
      socketRef.current = socket;

      socket.onopen = () => {
        connectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "join_request_created") {
          syncOrUpdateBoard(data.board as Board | undefined);
          toast.info("New join request received.");
          return;
        }

        if (data.type === "join_request_approved") {
          syncOrUpdateBoard(data.board as Board | undefined);
          // toast.success("Join request approved.");
          return;
        }

        if (data.type === "board_access_granted") {
          if (data.board) {
            onBoardAddedRef.current(data.board as Board);
          } else {
            void syncBoards(300);
          }
          toast.success(`Access granted to ${data.board?.name ?? "board"}.`);
          return;
        }

        if (data.type === "join_request_rejected") {
          if (data.board) {
            onBoardUpdatedRef.current(data.board as Board);
          }
          // toast.info(
          //   data.board_name
          //     ? `Request rejected for ${data.board_name}.`
          //     : "Join request rejected.",
          // );
        }
      };

      socket.onerror = () => {
        connectingRef.current = false;
      };

      socket.onclose = () => {
        connectingRef.current = false;

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (unmountedRef.current) return;

        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [enabled]);
}
