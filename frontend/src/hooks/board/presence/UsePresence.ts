import { useState, useEffect, useRef } from "react";

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
  viewportRef: React.RefObject<any>; // ✅ NEW
}

export function usePresence({
  socketRef,
  currentUserId,
  onMessage,
  viewportRef,
}: UsePresenceProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const lastSentRef = useRef(0);

  useEffect(() => {
    const unregister = onMessage((data) => {
      if (data.type === "presence_init") {
        setUsers(data.users.map((u: PresenceUser) => ({ ...u, cursor: null })));
        return true;
      }

      if (data.type === "user_joined") {
        setUsers((prev) => {
          if (prev.some((u) => u.user_id === data.user.user_id)) return prev;
          return [...prev, { ...data.user, cursor: null }];
        });
        return true;
      }

      if (data.type === "user_left") {
        setUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
        return true;
      }

      if (data.type === "cursor_move") {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === data.user_id
              ? { ...u, cursor: { x: data.x, y: data.y } } // WORLD coords
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
  }, [onMessage]);

  useEffect(() => {
    let pending = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (pending) return;
      pending = true;

      requestAnimationFrame(() => {
        pending = false;

        const ws = socketRef.current;
        const viewport = viewportRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || !viewport) return;

        const worldPos = viewport.toWorld(e.clientX, e.clientY);

        ws.send(
          JSON.stringify({
            type: "cursor_move",
            x: worldPos.x,
            y: worldPos.y,
          }),
        );
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socketRef, viewportRef]);
  const otherUsers = users.filter((u) => u.user_id !== currentUserId);

  return { users, otherUsers };
}
