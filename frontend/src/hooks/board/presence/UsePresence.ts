import { useState, useEffect } from "react";

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

  useEffect(() => {
    const unregister = onMessage((data) => {
        if (data.type === "presence_init") {
            console.log("presence_init users:", data.users);
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
        console.log("user_joined:", data.user);
        setUsers((prev) => {
          console.log(
            "current users before join:",
            prev.map((u) => u.user_id),
          );
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
        console.log(
          "👥 remote selection_update received:",
          data.user_id,
          data.selected_ids,
        );
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
    let lastSent = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < 150) return; // max 20 updates/sec
      lastSent = now;

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
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socketRef, viewportRef]);
  const otherUsers = users.filter((u) => u.user_id !== currentUserId);

  return { users, otherUsers };
}
