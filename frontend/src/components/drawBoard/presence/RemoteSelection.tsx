import React from "react";
import type { PresenceUser } from "../../../hooks/board/presence/UsePresence";
import { getUserColor } from "../../../hooks/board/presence/UsePresence";
import type { BoardObject } from "../../../types/board";

interface Props {
  users: PresenceUser[];
  objects: BoardObject[];
  viewportRef: React.RefObject<any>;
  isPreviewMode: boolean;
}

function getObjectBounds(o: BoardObject) {
  if (o.type === "line") {
    const x1 = o.x + (o.data?.x1 ?? 0);
    const y1 = o.y + (o.data?.y1 ?? 0);
    const x2 = o.x + (o.data?.x2 ?? o.width ?? 200);
    const y2 = o.y + (o.data?.y2 ?? 0);
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
  }
  return {
    minX: o.x,
    minY: o.y,
    maxX: o.x + (o.width ?? 200),
    maxY: o.y + (o.height ?? 120),
  };
}

export default function RemoteSelections({
  users,
  objects,
  viewportRef,
  isPreviewMode,
}: Props) {
  if (isPreviewMode) return null;

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

        const bounds = selectedObjects.map(getObjectBounds);

        const minX = Math.min(...bounds.map((b) => b.minX));
        const minY = Math.min(...bounds.map((b) => b.minY));
        const maxX = Math.max(...bounds.map((b) => b.maxX));
        const maxY = Math.max(...bounds.map((b) => b.maxY));

        const topLeft = viewport.toScreen(minX, minY);
        const bottomRight = viewport.toScreen(maxX, maxY);

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        const color = getUserColor(user.user_id);

        return (
          <div
            key={user.user_id}
            className="fixed pointer-events-none z-[9996]"
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