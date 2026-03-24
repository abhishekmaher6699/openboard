import type { BoardCardProps } from "../../../types/dashboard";
import BoardMenu from "./BoardMenu";
import { bauhausFont, cardClass } from "../dashboardTheme";

const accentStyles = [
  { stripe: "#1a3a6b", stamp: "#d62828" },
  { stripe: "#d62828", stamp: "#f7b731" },
  { stripe: "#f7b731", stamp: "#1a3a6b" },
  { stripe: "#0a0a0a", stamp: "#d62828" },
  { stripe: "#1a3a6b", stamp: "#f7b731" },
];

export default function Boardcard({
  board,
  currentUserId,
  onDelete,
  index,
  onLeave,
  onOpen,
  onBoardUpdated,
}: BoardCardProps) {
  const accent = accentStyles[index! % accentStyles.length];
  const isOwner = currentUserId !== null && board.owner.id === currentUserId;

  return (
    <div
      className={`group w-full cursor-pointer overflow-hidden ${cardClass} transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#0a0a0a] dark:hover:shadow-[5px_5px_0px_#ffffff]`}
      onClick={() => onOpen(board.public_id)}
    >
      <div className="h-2 w-full" style={{ backgroundColor: accent.stripe }} />

      <div className="flex min-h-32 flex-col justify-between p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="truncate pr-2 text-[1rem] font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f5f0e8] sm:text-[1.1rem]"
            style={bauhausFont}
          >
            {board.name}
          </h3>

          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <BoardMenu
              board={board}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onLeave={onLeave}
              onBoardUpdated={onBoardUpdated}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <p>
            <span
              className="mr-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#4f4a42] dark:text-[#c8c0b0]"
              style={bauhausFont}
            >
              Owner
            </span>
            <span className="font-bold text-[#0a0a0a] dark:text-[#f5f0e8]">
              {board.owner.username}
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4f4a42] dark:text-[#c8c0b0]">
            <span
              className="border-2 border-[#0a0a0a] px-3 py-2 font-mono text-[0.72rem] text-[#0a0a0a] dark:border-[#f3f3f3] dark:text-[#f5f0e8]"
              style={{ boxShadow: `2px 2px 0px ${accent.stripe}` }}
            >
              {board.invite_code}
            </span>

            <span
              className="border-2 border-[#0a0a0a] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#0a0a0a] dark:border-[#f5f0e8] dark:text-[#f5f0e8]"
              style={bauhausFont}
            >
              {board.member_count} Members
            </span>
            {isOwner && board.pending_request_count > 0 && (
              <span
                className="border-2 border-[#d62828] bg-[#d62828] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#f5f0e8]"
                style={bauhausFont}
              >
                {board.pending_request_count} Pending
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
