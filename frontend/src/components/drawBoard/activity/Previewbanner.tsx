import type { PreviewBannerProps } from "../../../types/board";
import { boardShell } from "../boardChromeTheme";

export default function PreviewBanner({
  label,
  onRestore,
  onExit,
}: PreviewBannerProps) {
  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[10001] flex min-h-11 flex-wrap items-center justify-center gap-3 px-4 py-2 text-[13px] text-[#0a0a0a] ${boardShell} dark:text-[#f5f0e8]`}
    >
      <span className="text-gray-500 dark:text-gray-400">Viewing history</span>
      <span className="font-medium">{label}</span>

      <div className="ml-0 flex gap-2 sm:ml-2">
        <button
          onClick={onRestore}
          className="cursor-pointer border-2 border-[#0a0a0a] bg-[#0a0a0a] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#d62828] dark:border-[#f5f0e8] dark:bg-[#f5f0e8] dark:text-[#0a0a0a] dark:hover:bg-[#f7b731]"
        >
          Restore this state
        </button>
        <button
          onClick={onExit}
          className="cursor-pointer border-2 border-[#0a0a0a] bg-transparent px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:text-gray-300 dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
