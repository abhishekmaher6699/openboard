import type { PreviewBannerProps } from "../../../types/board"

export default function PreviewBanner({ label, onRestore, onExit }: PreviewBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-11 bg-[#1a1a1a] text-white flex items-center justify-center gap-4 z-10001 text-[13px]">
      <span className="text-gray-400">Viewing history —</span>
      <span className="font-medium">{label}</span>

      <div className="flex gap-2 ml-2">
        <button
          onClick={onRestore}
          className="px-3 py-1 bg-white text-[#1a1a1a] border-none rounded cursor-pointer text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          Restore this state
        </button>
        <button
          onClick={onExit}
          className="px-3 py-1 bg-transparent text-gray-400 border border-gray-700 rounded cursor-pointer text-xs hover:text-white transition-colors"
        >
          Exit
        </button>
      </div>
    </div>
  )
}