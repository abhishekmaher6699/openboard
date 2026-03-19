import { useState } from "react";
import type { PresenceUser } from "../../../hooks/board/presence/UsePresence";
import { getInitials } from "../../../hooks/board/presence/UsePresence";
import { getUserColor } from "../../../lib/activityUtils";

interface ActiveUsersProps {
  users: PresenceUser[];
  currentUserId: number | null;
}

export default function ActiveUsers({ users, currentUserId }: ActiveUsersProps) {
  const [expanded, setExpanded] = useState(false);
  if (users.length === 0) return null;

  const MAX_VISIBLE = 4;
  const visible = expanded ? users : users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div className="fixed top-4 left-4 z-10000 flex flex-col gap-2">
      {/* Header pill */}
      <div
        onClick={() => setExpanded(o => !o)}
        className="flex items-center gap-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-slate-200 dark:border-neutral-700 rounded-full px-3 py-1.5 shadow-md w-fit cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-700/90 transition-colors"
      >
        {/* Stacked avatars */}
        <div className="flex items-center">
          {visible.map((user, i) => {
            const color = getUserColor(user.username);
            const initials = getInitials(user.username);
            const isYou = user.user_id === currentUserId;
            return (
              <div
                key={user.user_id}
                className="relative group"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white dark:ring-neutral-800 shadow-sm cursor-default select-none"
                  style={{ background: color }}
                >
                  {initials}
                </div>

                {/* Tooltip */}
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-neutral-700 text-white text-[11px] rounded-md px-2 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                  {isYou ? `${user.username} (you)` : user.username}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-neutral-700 rotate-45" />
                </div>
              </div>
            );
          })}

          {/* Overflow badge */}
          {!expanded && overflow > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-gray-300 text-[11px] font-semibold ring-2 ring-white dark:ring-neutral-800 shadow-sm hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              +{overflow}
            </button>
          )}
        </div>

        {/* Online count label */}
        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-none">
          {users.length === 1 ? "1 online" : `${users.length} online`}
        </span>

        {/* Collapse button */}
        {expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="text-[11px] text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors ml-1"
          >
            ▲
          </button>
        )}
      </div>

      {/* Expanded user list */}
      {expanded && (
        <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg p-2 flex flex-col gap-1 w-44">
          {users.map((user) => {
            const color = getUserColor(user.username);
            const initials = getInitials(user.username);
            const isYou = user.user_id === currentUserId;
            return (
              <div
                key={user.user_id}
                className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {initials}
                </div>

                <span className="text-xs text-slate-700 dark:text-gray-200 truncate">
                  {user.username}
                  {isYou && (
                    <span className="text-slate-400 dark:text-gray-500 ml-1">
                      (you)
                    </span>
                  )}
                </span>

                {/* Live dot */}
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}