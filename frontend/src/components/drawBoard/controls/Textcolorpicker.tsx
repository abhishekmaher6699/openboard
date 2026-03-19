import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type { TextColorPickerProps } from "../../../types/board"

const PRESET_COLORS = [
  "#1a1a1a", "#ffffff", "#ef4444", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#92400e",
]

export default function TextColorPicker({ value, onChange }: TextColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (open && buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect())
    }
  }, [open])

  const PICKER_HEIGHT = 170
  const PICKER_WIDTH = 148
  const GAP = 8
  const VIEWPORT_PADDING = 8

  const popoverStyle: React.CSSProperties = {}

  if (rect) {
    const spaceAbove = rect.top
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left

    if (spaceAbove >= PICKER_HEIGHT + GAP) {
      popoverStyle.top = rect.top - GAP
      popoverStyle.left = rect.left + rect.width / 2
      popoverStyle.transform = "translate(-50%, -100%)"
    } else if (spaceRight >= PICKER_WIDTH + GAP) {
      popoverStyle.top = rect.bottom
      popoverStyle.left = rect.right + GAP
      popoverStyle.transform = "translateY(0)"
    } else if (spaceLeft >= PICKER_WIDTH + GAP) {
      popoverStyle.top = rect.bottom
      popoverStyle.left = rect.left - GAP
      popoverStyle.transform = "translate(-100%, 0)"
    } else {
      popoverStyle.top = rect.bottom + GAP
      popoverStyle.left = rect.left + rect.width / 2
      popoverStyle.transform = "translateX(-50%)"
    }

    if (typeof popoverStyle.left === "number") {
      const half = PICKER_WIDTH / 2
      popoverStyle.left = Math.min(
        window.innerWidth - half - VIEWPORT_PADDING,
        Math.max(half + VIEWPORT_PADDING, popoverStyle.left)
      )
    }

    if (typeof popoverStyle.top === "number") {
      popoverStyle.top = Math.min(
        window.innerHeight - VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, popoverStyle.top)
      )
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        title="Text color"
        className={`w-7 h-7 flex flex-col items-center justify-center rounded cursor-pointer gap-0.5 p-0 transition-colors ${
          open
            ? "bg-slate-100 dark:bg-neutral-700"
            : "hover:bg-slate-100 dark:hover:bg-neutral-700"
        }`}
      >
        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 leading-none">A</span>
        <div className="w-3.5 h-0.5 rounded-sm" style={{ background: value }} />
      </button>

      {open && rect && createPortal(
        <div
          ref={popoverRef}
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-2 shadow-lg z-10001 w-37"
          style={popoverStyle}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-1 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="w-6 h-6 rounded cursor-pointer transition-transform hover:scale-110"
                style={{
                  background: c,
                  border: c === value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                }}
              />
            ))}
          </div>

          <div className="h-px bg-slate-200 dark:bg-neutral-700 mb-2" />

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 dark:text-gray-300">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-6 h-6 border border-slate-200 dark:border-neutral-700 rounded cursor-pointer p-px"
            />
            Custom
          </label>
        </div>,
        document.body
      )}
    </div>
  )
}