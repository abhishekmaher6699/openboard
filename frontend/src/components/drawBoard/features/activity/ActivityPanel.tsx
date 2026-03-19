import React, { useState } from "react";
import type { BoardActivity, BoardObject } from "../../../../types/board";
import { replayToActivity } from "../../../../lib/diffUtils";

type Props = {
  activities: BoardActivity[];
  loading: boolean;
  ready: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (snapshot: BoardObject[], label: string, sequence: number) => void;
  onRestore: (snapshot: BoardObject[], sequence: number) => void;
  activeSnapshot: BoardObject[] | null;
  currentActivityId: string | null;
  exitPreview: () => void;
};

const ACTION_LABELS: Record<string, string> = {
  create_shape: "created a shape",
  delete_shape: "deleted a shape",
  delete_many: "deleted multiple shapes",
  move_shape: "moved a shape",
  move_many: "moved multiple shapes",
  resize_shape: "resized a shape",
  resize_many: "resized multiple shapes",
  update_color: "changed color",
  update_text: "edited text",
  update_object: "updated an object",
  bring_forward: "brought forward",
  send_back: "sent backward",
  bring_to_front: "brought to front",
  send_to_back: "sent to back",
  bold_text: "toggled bold",
  italic_text: "toggled italic",
  font_size: "changed font size",
  align_text: "changed alignment",
  font_family: "changed font",
  text_color: "changed text color",
};

function groupActivities(activities: BoardActivity[]) {
  if (!activities) return [];
  const groups: BoardActivity[][] = [];
  activities.forEach((activity) => {
    const last = groups[groups.length - 1];
    if (
      last &&
      last[0].user?.id === activity.user?.id &&
      last[0].action_type === activity.action_type &&
      new Date(activity.created_at).getTime() -
        new Date(last[last.length - 1].created_at).getTime() < 5000
    ) {
      last.push(activity);
    } else {
      groups.push([activity]);
    }
  });
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getSafeSnapshot(
  group: BoardActivity[],
  allGroups: BoardActivity[][],
  groupIdx: number,
): BoardObject[] | null {
  for (let i = group.length - 1; i >= 0; i--) {
    const snap = group[i].snapshot;
    if (snap != null) return snap as BoardObject[];
  }
  for (let g = groupIdx - 1; g >= 0; g--) {
    const grp = allGroups[g];
    for (let i = grp.length - 1; i >= 0; i--) {
      const snap = grp[i].snapshot;
      if (snap != null) return snap as BoardObject[];
    }
  }
  return null;
}

export default function ActivityPanel({
  activities = [],
  loading,
  ready,
  isOpen,
  onClose,
  onPreview,
  onRestore,
  activeSnapshot,
  currentActivityId,
  exitPreview,
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // current state is active when not in preview and cursor is at latest activity
  const isCurrentStateActive = ready &&
    !activeSnapshot &&
    currentActivityId === (activities[activities.length - 1]?.id ?? null);

  // reverse for display — latest first
  const groups = groupActivities([...activities].reverse());

  const toggleGroup = (idx: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // console.log(currentActivityId)
  const isGroupActive = (group: BoardActivity[]) =>
    !activeSnapshot && group.some((a) => a.id === currentActivityId);

  const isActivityActive = (activity: BoardActivity) =>
    !activeSnapshot && activity.id === currentActivityId;

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-80 bg-white border-l border-slate-200 flex flex-col z-[9998] transition-transform duration-250 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ boxShadow: isOpen ? "-4px 0 16px rgba(0,0,0,0.08)" : "none" }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="font-medium text-[15px] text-gray-900">Activity</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
        )}

        {!loading && activities.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-400">No activity yet</div>
        )}

        {/* Current state entry — always at top */}
        {/* <div
          className={`border-b border-slate-100 px-4 py-2.5 flex items-center gap-2.5 cursor-pointer transition-colors ${
            isCurrentStateActive ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
          onClick={() => { if (activeSnapshot) exitPreview(); }}
        >
          <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-semibold">●</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-gray-900 font-medium">Current state</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Live board</div>
          </div>
          {isCurrentStateActive && (
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
              viewing
            </span>
          )}
        </div> */}

        {groups.map((group, groupIdx) => {

          const first = group[0];
          const last = group[group.length - 1];
          const isExpanded = expandedGroups.has(groupIdx);
          const isMultiple = group.length > 1;
          const label = ACTION_LABELS[first.action_type] ?? "updated an object";
          const isActive = isGroupActive(group);

          return (
            <div
              key={groupIdx}
              className={`border-b border-slate-100 ${isActive ? "bg-blue-50" : ""}`}
            >
              <div
                className={`px-4 py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                  isActive ? "hover:bg-blue-100" : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  const snapshot = replayToActivity(activities, last.id);
                  onPreview(
                    snapshot,
                    `${formatDate(last.created_at)} ${formatTime(last.created_at)}`,
                    last.sequence
                  );
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                  style={{
                    background: `hsl(${(first.user?.username?.charCodeAt(0) ?? 0) * 20}, 60%, 60%)`,
                  }}
                >
                  {first.user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-900">
                    <span className="font-medium">{first.user?.username ?? "Unknown"}</span>{" "}
                    {isMultiple ? `${label} (×${group.length})` : label}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {formatDate(first.created_at)} · {formatTime(first.created_at)}
                  </div>
                  {/* <div className="text-black">
                    {first.id}
                  </div> */}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isActive && (
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      viewing
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingId(`${groupIdx}`);
                    }}
                    className="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded cursor-pointer bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Restore
                  </button>
                  {isMultiple && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(groupIdx);
                      }}
                      className="bg-transparent border-none cursor-pointer text-gray-400 text-xs p-0.5 hover:text-gray-600"
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded &&
                group.map((activity) => {
                  const isActiveSub = isActivityActive(activity);
                  return (
                    <div
                      key={activity.id}
                      onClick={() => {
                        const snapshot = replayToActivity(activities, activity.id);
                        onPreview(
                          snapshot,
                          `${formatDate(activity.created_at)} ${formatTime(activity.created_at)}`,
                          activity.sequence
                        );
                      }}
                      className={`pl-[54px] pr-4 py-1.5 text-xs text-gray-500 cursor-pointer flex justify-between items-center transition-colors ${
                        isActiveSub ? "bg-blue-100" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{label}</span>
                        {isActiveSub && (
                          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                            viewing
                          </span>
                        )}
                      </div>
                      <span className="text-[11px]">{formatTime(activity.created_at)}</span>
                    </div>
                  );
                })}

              {confirmingId === `${groupIdx}` && (
                <div
                  className="mx-4 mb-2.5 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-[13px] text-yellow-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 font-medium">Restore board to this state?</div>
                  <div className="text-xs mb-2.5 text-yellow-800">
                    This will restore the board for all users.
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const snapshot = replayToActivity(activities, last.id);
                        onRestore(snapshot, last.sequence);
                        setConfirmingId(null);
                      }}
                      className="flex-1 py-1.5 bg-gray-900 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-gray-700 transition-colors"
                    >
                      Restore for everyone
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded cursor-pointer text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}