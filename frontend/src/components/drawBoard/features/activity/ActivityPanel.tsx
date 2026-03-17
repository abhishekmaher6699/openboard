import React, { useState } from "react";
import type { BoardActivity, BoardObject } from "../../../../types/board";

type Props = {
  activities: BoardActivity[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (snapshot: BoardObject[], label: string) => void;
  onRestore: (snapshot: BoardObject[], activityId: string) => void;
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

// group consecutive activities by same user + same type within 5 seconds
function groupActivities(activities: BoardActivity[]) {
  const groups: BoardActivity[][] = [];

  activities.forEach((activity) => {
    const last = groups[groups.length - 1];
    if (
      last &&
      last[0].user?.id === activity.user?.id &&
      last[0].action_type === activity.action_type &&
      new Date(activity.created_at).getTime() -
        new Date(last[last.length - 1].created_at).getTime() <
        5000
    ) {
      last.push(activity);
    } else {
      groups.push([activity]);
    }
  });

  return groups;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

export default function ActivityPanel({
  activities,
  loading,
  isOpen,
  onClose,
  onPreview,
  onRestore,
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const groups = groupActivities(activities);

  const toggleGroup = (idx: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  function getSafeSnapshot(
    group: BoardActivity[],
    allGroups: BoardActivity[][],
    groupIdx: number,
  ): BoardObject[] | null {
    // check current group (latest first)
    for (let i = group.length - 1; i >= 0; i--) {
      const snap = group[i].snapshot;
      if (snap != null) return snap as BoardObject[];
    }

    // fallback to previous groups
    for (let g = groupIdx - 1; g >= 0; g--) {
      const grp = allGroups[g];
      for (let i = grp.length - 1; i >= 0; i--) {
        const snap = grp[i].snapshot;
        if (snap != null) return snap as BoardObject[];
      }
    }

    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : "-320px",
        width: "320px",
        height: "100vh",
        background: "white",
        borderLeft: "1px solid #e2e8f0",
        boxShadow: isOpen ? "-4px 0 16px rgba(0,0,0,0.08)" : "none",
        transition: "right 0.25s ease",
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 500, fontSize: "15px", color: "#1a1a1a" }}>
          Activity
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "#6b7280",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          ×
        </button>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading && (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            Loading...
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            No activity yet
          </div>
        )}

        {groups.map((group, groupIdx) => {
          const first = group[0];
          const last = group[group.length - 1];
          const isExpanded = expandedGroups.has(groupIdx);
          const isMultiple = group.length > 1;
          const label = ACTION_LABELS[first.action_type] ?? first.action_type;

          return (
            <div key={groupIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
              {/* Group header */}
              <div
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const snapshot = getSafeSnapshot(group, groups, groupIdx);
                  if (snapshot == null) return;
                  if (!snapshot) return;
                  onPreview(
                    snapshot,
                    `${formatDate(last.created_at)} ${formatTime(last.created_at)}`,
                  );
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `hsl(${(first.user?.username?.charCodeAt(0) ?? 0) * 20}, 60%, 60%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {first.user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "#1a1a1a" }}>
                    <span style={{ fontWeight: 500 }}>
                      {first.user?.username ?? "Unknown"}
                    </span>{" "}
                    {isMultiple ? `${label} (×${group.length})` : label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginTop: "2px",
                    }}
                  >
                    {formatDate(first.created_at)} ·{" "}
                    {formatTime(first.created_at)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                  }}
                >
                  {/* Restore button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingId(`${groupIdx}`);
                    }}
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "white",
                      color: "#6b7280",
                    }}
                  >
                    Restore
                  </button>

                  {/* Expand arrow */}
                  {isMultiple && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(groupIdx);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                        fontSize: "12px",
                        padding: "2px",
                      }}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded items */}
              {isExpanded &&
                group.map((activity, i) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      const snap = activity.snapshot as BoardObject[];
                      if (snap === null ) return;
                      onPreview(
                        snap,
                        `${formatDate(activity.created_at)} ${formatTime(activity.created_at)}`,
                      );
                    }}
                    style={{
                      padding: "6px 16px 6px 54px",
                      fontSize: "12px",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f9fafb",
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ fontSize: "11px" }}>
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                ))}

              {/* Confirm restore popup */}
              {confirmingId === `${groupIdx}` && (
                <div
                  style={{
                    margin: "0 16px 10px",
                    padding: "12px",
                    background: "#fef9c3",
                    border: "1px solid #fde047",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#713f12",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: "8px", fontWeight: 500 }}>
                    Restore board to this state?
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      marginBottom: "10px",
                      color: "#92400e",
                    }}
                  >
                    This will restore the board for all users.
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => {
                        onRestore(last.snapshot as BoardObject[], last.id);
                        setConfirmingId(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px",
                        background: "#1a1a1a",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      Restore for everyone
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      style={{
                        padding: "6px 10px",
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
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
