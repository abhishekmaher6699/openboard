import { useState } from "react";
import type { PresenceUser } from "../../../hooks/board/presence/UsePresence";
import { getInitials } from "../../../hooks/board/presence/UsePresence";
import { getUserColor } from "@/lib/activityUtils";
import ConfirmDialogButton from "../../ui/ConfirmDialogButton";
import { boardCard, boardShell } from "../boardChromeTheme";

interface ActiveUsersProps {
  users: PresenceUser[];
  currentUserId: number | null;
  isOwner?: boolean;
  onKick?: (userId: number) => void;
}

export default function ActiveUsers({
  users,
  currentUserId,
  isOwner,
  onKick,
}: ActiveUsersProps) {
  const [expanded, setExpanded] = useState(false);
  if (users.length === 0) return null;

  const maxVisible = 4;
  const visible = expanded ? users : users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className="fixed top-4 left-4 z-[10000] flex max-w-[calc(100vw-1rem)] flex-col gap-2">
      <div
        onClick={() => setExpanded((o) => !o)}
        className={`flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-[#f5f0e8] dark:hover:bg-[#1e1e1e] ${boardShell}`}
      >
        <div className="flex items-center">
          {visible.map((user, i) => {
            const color = getUserColor(user.username);
            const initials = getInitials(user.username);
            const isYou = user.user_id === currentUserId;
            return (
              <div
                key={user.user_id}
                className="group relative"
                style={{
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: visible.length - i,
                }}
              >
                <div
                  className="flex h-7 w-7 cursor-default select-none items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-white shadow-sm dark:ring-neutral-800"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap bg-gray-900 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-700">
                  {isYou ? `${user.username} (you)` : user.username}
                </div>
              </div>
            );
          })}

          {!expanded && overflow > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-2 ring-white shadow-sm transition-colors hover:bg-slate-200 dark:bg-neutral-700 dark:text-gray-300 dark:ring-neutral-800 dark:hover:bg-neutral-600"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              +{overflow}
            </button>
          )}
        </div>

        <span className="text-xs font-medium leading-none text-slate-500 dark:text-gray-400">
          {users.length === 1 ? "1 online" : `${users.length} online`}
        </span>

        {expanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            className="ml-1 text-[11px] text-slate-400 transition-colors hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            ^
          </button>
        )}
      </div>

      {expanded && (
        <div className={`flex w-48 max-w-[calc(100vw-2rem)] flex-col gap-1 p-2 ${boardCard}`}>
          {users.map((user) => {
            const color = getUserColor(user.username);
            const initials = getInitials(user.username);
            const isYou = user.user_id === currentUserId;
            return (
              <div
                key={user.user_id}
                className="flex items-center gap-2 px-1 py-1 transition-colors hover:bg-[#0a0a0a]/4 dark:hover:bg-neutral-700"
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: color }}
                >
                  {initials}
                </div>

                <span className="flex-1 truncate text-xs text-slate-700 dark:text-gray-200">
                  {user.username}
                  {isYou && (
                    <span className="ml-1 text-slate-400 dark:text-gray-500">
                      (you)
                    </span>
                  )}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {isOwner && !isYou && onKick && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <ConfirmDialogButton
                        title={`Kick ${user.username}?`}
                        description={`${user.username} will be removed from this board and won't be able to rejoin unless invited again.`}
                        actionLabel="Kick"
                        trigger={
                          <button
                            title={`Kick ${user.username}`}
                            className="flex h-4 w-4 items-center justify-center text-[10px] text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            X
                          </button>
                        }
                        onConfirm={() => onKick(user.user_id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
