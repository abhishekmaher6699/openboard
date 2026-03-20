import { useState } from "react";
import type { BoardActivity, ActivityPanelProps } from "../../../types/board";
import { replayToActivity } from "../../../lib/diffUtils";
import {
  ACTION_LABELS,
  groupActivities,
  formatTime,
  formatDate,
  getLabelWithCount,
  getUserColor,
} from "../../../lib/activityUtils";

export default function ActivityPanel({
  activities = [],
  loading,
  isOpen,
  onClose,
  onPreview,
  onRestore,
  activeSnapshot,
  currentActivityId,
  objects
}: ActivityPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const groups = groupActivities([...activities].reverse());

  const toggleGroup = (idx: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const isGroupActive = (group: BoardActivity[]) =>
    !activeSnapshot && group.some((a) => a.id === currentActivityId);

  const isActivityActive = (activity: BoardActivity) =>
    !activeSnapshot && activity.id === currentActivityId;

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-80 bg-white dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-700 flex flex-col z-10000 transition-transform duration-250 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ boxShadow: isOpen ? "-4px 0 16px rgba(0,0,0,0.08)" : "none" }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
        <span className="font-medium text-[15px] text-gray-900 dark:text-gray-100">
          Activity
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            Loading...
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No activity yet
          </div>
        )}

        {groups.map((group, groupIdx) => {
          const first = group[0];
          const last = group[group.length - 1];
          const isExpanded = expandedGroups.has(groupIdx);
          const isMultiple = group.length > 1;
          const label =
            ACTION_LABELS[first.action_type] ?? "updated an object";
          const isActive = isGroupActive(group);

          const labelWithCount = getLabelWithCount(label, first.diff);

          return (
            <div
              key={groupIdx}
              className={`border-b border-slate-100 dark:border-neutral-800 ${
                isActive ? "bg-blue-50 dark:bg-blue-900/30" : ""
              }`}
            >
              <div
                className={`px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                  first.action_type === "restore"
                    ? "cursor-default bg-gray-200 dark:bg-neutral-700"
                    : "cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800"
                } ${isActive ? "hover:bg-blue-100 dark:hover:bg-blue-900/40" : ""}`}
                onClick={() => {
                  if (first.action_type === "restore") return;
                  const snapshot = replayToActivity(activities, last.id, objects);
                  onPreview(
                    snapshot,
                    `${formatDate(last.created_at)} ${formatTime(
                      last.created_at
                    )}`,
                    last.sequence
                  );
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                  style={{
                    background: getUserColor(first.user?.username),
                  }}
                >
                  {first.user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-900 dark:text-gray-100">
                    <span className="font-medium">
                      {first.user?.username ?? "Unknown"}
                    </span>{" "}
                    {isMultiple
                      ? `${labelWithCount} (×${group.length})`
                      : labelWithCount}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(first.created_at)} ·{" "}
                    {formatTime(first.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isActive && (
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      viewing
                    </span>
                  )}
                  {first.action_type !== "restore" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(`${groupIdx}`);
                      }}
                      className="text-[11px] px-1.5 py-0.5 border border-slate-200 dark:border-neutral-700 rounded cursor-pointer bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                  {isMultiple && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(groupIdx);
                      }}
                      className="bg-transparent border-none cursor-pointer text-gray-400 dark:text-gray-500 text-xs p-0.5 hover:text-gray-600 dark:hover:text-gray-300"
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
                        const snapshot = replayToActivity(
                          activities,
                          activity.id,
                          objects
                        );
                        onPreview(
                          snapshot,
                          `${formatDate(activity.created_at)} ${formatTime(
                            activity.created_at
                          )}`,
                          activity.sequence
                        );
                      }}
                      className={`pl-13.5 pr-4 py-1.5 text-xs text-gray-500 dark:text-gray-300 cursor-pointer flex justify-between items-center transition-colors ${
                        isActiveSub
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : "bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700"
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
                      <span className="text-[11px]">
                        {formatTime(activity.created_at)}
                      </span>
                    </div>
                  );
                })}

              {confirmingId === `${groupIdx}` && (
                <div
                  className="mx-4 mb-2.5 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-[13px] text-yellow-900 dark:text-yellow-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 font-medium">
                    Restore board to this state?
                  </div>
                  <div className="text-xs mb-2.5 text-yellow-800 dark:text-yellow-300">
                    This will restore the board for all users.
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const snapshot = replayToActivity(activities, last.id, objects);
                        onRestore(snapshot, last.sequence);
                        setConfirmingId(null);
                      }}
                      className="flex-1 py-1.5 bg-gray-900 dark:bg-gray-700 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      Restore for everyone
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded cursor-pointer text-xs text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
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