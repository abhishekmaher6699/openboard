import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface PresenceUser {
  user_id: number;
  username: string;
  cursor?: { x: number; y: number } | null;
  selection?: string[];
}

const USER_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function getUserColor(userId: number): string {
  return USER_COLORS[userId % USER_COLORS.length];
}

export function getInitials(username: string): string {
  return username
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface UsePresenceProps {
  socketRef: React.RefObject<WebSocket | null>;
  currentUserId: number | null;
  onMessage: (handler: (data: any) => boolean) => () => void;
  viewportRef: React.RefObject<any>;
}

export function usePresence({
  socketRef,
  currentUserId,
  onMessage,
  viewportRef,
}: UsePresenceProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const navigate = useNavigate();

  const recentlyLeft = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );


  const send = useCallback(
    (payload: object) => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(payload));
    },
    [socketRef],
  );


  const lastCursorSent = useRef(0);
  const lastCursorPos = useRef<{ x: number; y: number } | null>(null);


  let timeout: any;

  function sendSelection(ids: string[]) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      send({
        type: "selection_update",
        selected_ids: ids,
      });
    }, 200);
  }

  const selectionRef = useRef(sendSelection);


  useEffect(() => {
    const unregister = onMessage((data) => {
      if (data.type === "presence_init") {
        const seen = new Set();
        const unique = data.users.filter((u: PresenceUser) => {
          if (seen.has(u.user_id)) return false;
          seen.add(u.user_id);
          return true;
        });
        setUsers(unique.map((u: PresenceUser) => ({ ...u, cursor: null })));
        return true;
      }

      if (data.type === "user_joined") {
        setUsers((prev) => {
          if (prev.some((u) => u.user_id === data.user.user_id)) return prev;
          return [...prev, { ...data.user, cursor: null }];
        });

        if (data.user.user_id !== currentUserId) {
          if (recentlyLeft.current.has(data.user.user_id)) {
            clearTimeout(recentlyLeft.current.get(data.user.user_id));
            recentlyLeft.current.delete(data.user.user_id);
          } else {
            toast(`${data.user.username} joined the board`, {
              icon: "",
              duration: 3000,
            });
          }
        }
        return true;
      }

      if (data.type === "user_left") {
        setUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));

        if (data.user_id !== currentUserId && data.username) {
          const timer = setTimeout(() => {
            toast(`${data.username} left the board`, {
              icon: "",
              duration: 3000,
            });
            recentlyLeft.current.delete(data.user_id);
          }, 2000);

          recentlyLeft.current.set(data.user_id, timer);
        }
        return true;
      }

      if (data.type === "user_kicked") {
        setUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));

        if (data.user_id === currentUserId) {
          toast.error("You have been removed from this board", {
            duration: 5000,
          });
          navigate("/dashboard");
        } else {
          toast(`${data.username} was removed from the board`, {
            icon: "x",
            duration: 3000,
          });
        }
        return true;
      }

      if (data.type === "cursor_move") {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === data.user_id
              ? { ...u, cursor: { x: data.x, y: data.y } }
              : u,
          ),
        );
        return true;
      }

      if (data.type === "selection_update") {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === data.user_id
              ? { ...u, selection: data.selected_ids }
              : u,
          ),
        );
        return true;
      }

      return false;
    });

    return unregister;
  }, [onMessage, currentUserId, navigate]);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCursorSent.current < 100) return;

      const ws = socketRef.current;
      const viewport = viewportRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !viewport) return;

      const worldPos = viewport.toWorld(e.clientX, e.clientY);

      // movement threshold (huge optimization)
      if (lastCursorPos.current) {
        const dx = Math.abs(worldPos.x - lastCursorPos.current.x);
        const dy = Math.abs(worldPos.y - lastCursorPos.current.y);
        if (dx < 2 && dy < 2) return;
      }

      lastCursorSent.current = now;
      lastCursorPos.current = worldPos;

      send({
        type: "cursor_move",
        x: worldPos.x,
        y: worldPos.y,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socketRef, viewportRef, send]);


  useEffect(() => {
    return () => {
      recentlyLeft.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const kickUser = useCallback(
    (userId: number) => {
      send({ type: "kick_user", user_id: userId });
    },
    [send],
  );

  const otherUsers = users.filter((u) => u.user_id !== currentUserId);

  return {
    users,
    otherUsers,
    kickUser,
    sendSelection,
  };
}
