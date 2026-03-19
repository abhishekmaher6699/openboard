import type { BoardCardProps } from "../../../types/dashboard";
import BoardMenu from "./BoardMenu";

const colors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
];

export default function Boardcard({
  board,
  currentUserId,
  onDelete,
  index,
  onLeave,
  onOpen,
}: BoardCardProps) {
  const color = colors[index! % colors.length];

  return (
    <div
      className="
        group
        bg-white dark:bg-neutral-800
        border border-gray-200 dark:border-white border-t-0
        rounded-xl overflow-hidden w-full
        transition-all duration-200 ease-out
        hover:-translate-y-0.5
        hover:shadow-md cursor-pointer
      "
      onClick={() => onOpen(board.public_id)}
    >
      {/* Color Accent */}
      <div className={`h-1.5 w-full ${color}`} />

      <div className="p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-h-37.5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <h3
            className="
            text-base sm:text-lg font-semibold truncate
            text-gray-900 dark:text-gray-100
          "
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
            />
          </div>
        </div>

        {/* Meta */}
        <div
          className="
          mt-4 sm:mt-6 space-y-2 text-sm
          text-gray-600 dark:text-gray-400
        "
        >
          <p>
            Owner{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {board.owner.username}
            </span>
          </p>

          <div
            className="
            flex items-center justify-between
            text-xs text-gray-500 dark:text-gray-400
          "
          >
            <span
              className="
              font-mono px-2 py-1 rounded
              bg-gray-100 dark:bg-gray-700
              text-gray-700 dark:text-gray-300
            "
            >
              {board.invite_code}
            </span>

            <span>{board.member_count} members</span>
          </div>
        </div>
      </div>
    </div>
  );
}
