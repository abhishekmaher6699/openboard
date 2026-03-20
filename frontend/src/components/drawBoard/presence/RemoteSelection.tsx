import React from "react";
import type { PresenceUser } from "../../../hooks/board/presence/UsePresence";
import { getUserColor } from "../../../hooks/board/presence/UsePresence";
import type { BoardObject } from "../../../types/board";

interface Props {
  users: PresenceUser[];
  objects: BoardObject[];
  viewportRef: React.RefObject<any>;
  isPreviewMode: boolean
}

export default function RemoteSelections({
  users,
  objects,
  viewportRef,
  isPreviewMode
}: Props) {

  if (isPreviewMode) return null
  
  const viewport = viewportRef.current;
  if (!viewport) return null;

  const objectMap = new Map(objects.map((o) => [o.id, o]));

  return (
    <>
      {users.map((user) => {
        if (!user.selection || user.selection.length === 0) return null;

        const selectedObjects = user.selection
          .map((id) => objectMap.get(id))
          .filter(Boolean) as BoardObject[];

        if (selectedObjects.length === 0) return null;

        // 🔥 Compute bounding box in WORLD coords
        const minX = Math.min(...selectedObjects.map((o) => o.x));
        const minY = Math.min(...selectedObjects.map((o) => o.y));
        const maxX = Math.max(
          ...selectedObjects.map((o) => o.x + o.width)
        );
        const maxY = Math.max(
          ...selectedObjects.map((o) => o.y + o.height)
        );

        // 🔥 Convert to screen
        const topLeft = viewport.toScreen(minX, minY);
        const bottomRight = viewport.toScreen(maxX, maxY);

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        const color = getUserColor(user.user_id);

        return (
          <div
            key={user.user_id}
            className="fixed pointer-events-none z-9996"
            style={{
              left: topLeft.x,
              top: topLeft.y,
              width,
              height,
              border: `2px solid ${color}`,
              borderRadius: 4,
              boxShadow: `0 0 0 1px ${color}33`,
            }}
          >
            {/* Label */}
            <div
              className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] text-white rounded"
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