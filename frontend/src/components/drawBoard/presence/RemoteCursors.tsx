import React, { useEffect, useRef, useState } from "react";
import type { PresenceUser } from "../../../hooks/board/presence/UsePresence";
import { getUserColor } from "../../../lib/activityUtils";
import { useTheme } from "../../../context/theme-context";

interface RemoteCursorsProps {
  users: PresenceUser[];
  viewportRef: React.RefObject<any>;
}

interface AnimatedCursor {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export default function RemoteCursors({
  users,
  viewportRef,
}: RemoteCursorsProps) {

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [, forceUpdate] = useState(0);
  const cursorsRef = useRef<Map<number, AnimatedCursor>>(new Map());


  useEffect(() => {
    users.forEach((user) => {
      if (!user.cursor) return;

      const existing = cursorsRef.current.get(user.user_id);

      if (!existing) {
        cursorsRef.current.set(user.user_id, {
          x: user.cursor.x,
          y: user.cursor.y,
          targetX: user.cursor.x,
          targetY: user.cursor.y,
        });
      } else {
        existing.targetX = user.cursor.x;
        existing.targetY = user.cursor.y;
      }
    });
  }, [users]);

  // ✨ Animation loop (LERP)
  useEffect(() => {
    let raf: number;

    const animate = () => {
      cursorsRef.current.forEach((cursor) => {
        // 🔥 LERP (smooth movement)
        cursor.x += (cursor.targetX - cursor.x) * 0.2;
        cursor.y += (cursor.targetY - cursor.y) * 0.2;
      });

      forceUpdate((v) => v + 1);
      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  // 🔥 Re-render on viewport change
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const update = () => forceUpdate((v) => v + 1);

    viewport.on("moved", update);
    viewport.on("zoomed", update);

    return () => {
      viewport.off("moved", update);
      viewport.off("zoomed", update);
    };
  }, [viewportRef]);

  return (
    <>
      {users.map((user) => {
        const cursor = cursorsRef.current.get(user.user_id);
        if (!cursor) return null;

        const viewport = viewportRef.current;
        if (!viewport) return null;

        const screenPos = viewport.toScreen(cursor.x, cursor.y);

        const color = getUserColor(user.username);

        return (
          <div
            key={user.user_id}
            className="fixed pointer-events-none z-9997"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transform: "translate(-2px, -2px)",
              filter: isDark
                ? "drop-shadow(0 1px 3px rgba(0,0,0,0.8))"
                : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
            }}
          >
            {/* Cursor */}
            <svg width="18" height="22" viewBox="0 0 18 22">
              <path
                d="M0 0L0 16L4.5 12L7.5 19L9.5 18L6.5 11L12 11L0 0Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>

            {/* Label */}
            <div
              className="absolute top-4 left-3 px-1.5 py-0.5 rounded text-white text-[11px] font-medium whitespace-nowrap shadow-md"
              style={{ background: color }}
            >
              {user.username}
            </div>
          </div>
        );
      })}
    </>
  );
}