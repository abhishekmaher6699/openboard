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
import { boardShell } from "../boardChromeTheme";

export default function ActivityPanel({
  activities = [],
  loading,
  isOpen,
  onClose,
  onPreview,
  onRestore,
  activeSnapshot,
  currentActivityId,
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
      className={`fixed top-0 right-0 z-[10000] flex h-screen w-80 max-w-[92vw] flex-col border-l-2 border-[#0a0a0a] ${boardShell} transition-transform duration-200 dark:border-[#f5f0e8] ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b-2 border-[#0a0a0a]/15 px-4 py-4 dark:border-[#f5f0e8]/15">
        <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          Activity
        </span>
        <button
          onClick={onClose}
          className="px-1.5 py-0.5 text-lg text-gray-400 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
        >
          X
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
          const label = ACTION_LABELS[first.action_type] ?? "updated an object";
          const isActive = isGroupActive(group);
          const labelWithCount = getLabelWithCount(label, first.diff);

          return (
            <div
              key={groupIdx}
              className={`border-b border-[#0a0a0a]/8 dark:border-[#f5f0e8]/10 ${
                isActive ? "bg-[#1a3a6b]/8 dark:bg-[#f7b731]/12" : ""
              }`}
            >
              <div
                className={`flex items-start gap-2.5 px-4 py-2.5 transition-colors ${
                  first.action_type === "restore"
                    ? "cursor-default bg-[#0a0a0a]/8 dark:bg-neutral-700"
                    : "cursor-pointer hover:bg-[#0a0a0a]/4 dark:hover:bg-[#f5f0e8]/6"
                } ${isActive ? "hover:bg-[#1a3a6b]/12 dark:hover:bg-[#f7b731]/16" : ""}`}
                onClick={() => {
                  if (first.action_type === "restore") return;
                  const snapshot = replayToActivity(activities, last.id);
                  onPreview(
                    snapshot,
                    `${formatDate(last.created_at)} ${formatTime(last.created_at)}`,
                    last.sequence,
                  );
                }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: getUserColor(first.user?.username) }}
                >
                  {first.user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-gray-900 dark:text-gray-100">
                    <span className="font-medium">
                      {first.user?.username ?? "Unknown"}
                    </span>{" "}
                    {isMultiple ? `${labelWithCount} (x${group.length})` : labelWithCount}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDate(first.created_at)} · {formatTime(first.created_at)}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {isActive && (
                    <span className="bg-[#1a3a6b] px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-[#f7b731] dark:text-[#0a0a0a]">
                      viewing
                    </span>
                  )}
                  {first.action_type !== "restore" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(`${groupIdx}`);
                      }}
                      className="cursor-pointer border-2 border-[#0a0a0a] bg-white px-1.5 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
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
                      className="p-0.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {isExpanded ? "^" : "v"}
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
                          activity.sequence,
                        );
                      }}
                      className={`flex cursor-pointer items-center justify-between px-4 py-1.5 pl-13 text-xs text-gray-500 transition-colors dark:text-gray-300 ${
                        isActiveSub
                          ? "bg-[#1a3a6b]/12 dark:bg-[#f7b731]/16"
                          : "bg-[#0a0a0a]/4 hover:bg-[#0a0a0a]/8 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{label}</span>
                        {isActiveSub && (
                          <span className="bg-[#1a3a6b] px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-[#f7b731] dark:text-[#0a0a0a]">
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
                  className="mx-4 mb-2.5 border-2 border-[#0a0a0a] bg-[#f7b731]/20 p-3 text-[13px] text-[#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#f7b731]/15 dark:text-[#f5f0e8]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 font-medium">Restore board to this state?</div>
                  <div className="mb-2.5 text-xs opacity-80">
                    This will restore the board for all users.
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const snapshot = replayToActivity(activities, last.id);
                        onRestore(snapshot, last.sequence);
                        setConfirmingId(null);
                      }}
                      className="flex-1 cursor-pointer border-2 border-[#0a0a0a] bg-[#0a0a0a] py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d62828] dark:border-[#f5f0e8] dark:bg-[#f5f0e8] dark:text-[#0a0a0a] dark:hover:bg-[#f7b731]"
                    >
                      Restore for everyone
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer border-2 border-[#0a0a0a] bg-white px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
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
