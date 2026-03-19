import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../api/client";
import type { BoardActivity } from "../types/board";

const ACTIVITY_LIMIT = 50;

export function useBoardActivity(
  boardId: string,
  currentUserId: number | null,
) {
  // console.log("useBoardActivity render, currentUserId:", currentUserId);
  const [activities, setActivities] = useState<BoardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // track cursor by sequence number — stable regardless of array mutations
  const cursorSequenceRef = useRef<number>(0);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(
    null,
  );

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    apiRequest<BoardActivity[]>(
      `/boards/${boardId}/activities/?limit=${ACTIVITY_LIMIT}`,
    )
      .then((data) => {
        const sliced = data.slice(-ACTIVITY_LIMIT);
        setActivities(sliced);
        const myLast = [...sliced]
          .reverse()
          .find((a) => Number(a.user?.id) === currentUserId);
        cursorSequenceRef.current = myLast?.sequence ?? 0;
        setCurrentActivityId(myLast?.id ?? null);

        setReady(true);
        setLoading(false);
      })
      .catch(() => {
        setReady(true);
        setLoading(false);
      });
  }, [boardId]);

  const addActivity = (activity: BoardActivity, deletedIds?: string[]) => {
    setActivities((prev) => {
      const filtered = deletedIds?.length
        ? prev.filter((a) => !deletedIds.includes(a.id))
        : prev;

      if (filtered.some((a) => a.id === activity.id)) return filtered;

      const next = [...filtered, activity].slice(-ACTIVITY_LIMIT);

      console.log(activity.action_type);
      if (
        Number(activity.user?.id) === currentUserId &&
        activity.action_type !== "restore"
      ) {
        cursorSequenceRef.current = activity.sequence ?? 0;
        setCurrentActivityId(activity.id);
      }

      return next;
    });
  };

  // undo applied — move cursor to cursor_sequence sent by server
  const onUndoApplied = (
    cursorSequence: number,
    userId: number,
    currentUserId: number | null,
  ) => {
    if (userId !== currentUserId) return;
    setActivities((prev) => {
      cursorSequenceRef.current = cursorSequence;
      // find activity whose sequence === cursorSequence
      const activity = prev.find((a) => a.sequence === cursorSequence);
      setCurrentActivityId(activity?.id ?? null);
      return prev;
    });
  };

  // redo applied — move cursor to cursor_sequence sent by server
  const onRedoApplied = (
    cursorSequence: number,
    userId: number,
    currentUserId: number | null,
  ) => {
    if (userId !== currentUserId) return;
    setActivities((prev) => {
      cursorSequenceRef.current = cursorSequence;
      const activity = prev.find((a) => a.sequence === cursorSequence);
      setCurrentActivityId(activity?.id ?? null);
      return prev;
    });
  };

  const onRestoreApplied = (deletedIds: string[] = []) => {
    setActivities((prev) => {
      const filtered = deletedIds.length
        ? prev.filter((a) => !deletedIds.includes(a.id))
        : prev;

      // find last non-restore activity by this user
      const myLast = [...filtered]
        .reverse()
        .find(
          (a) => Number(a.user?.id) === currentUserIdRef.current && a.action_type !== "restore",
        );

      cursorSequenceRef.current = myLast?.sequence ?? 0;
      setCurrentActivityId(myLast?.id ?? null);
      return filtered;
    });
  };
  
  return {
    activities,
    loading,
    ready,
    addActivity,
    onUndoApplied,
    onRedoApplied,
    onRestoreApplied,
    currentActivityId,
  };
}
