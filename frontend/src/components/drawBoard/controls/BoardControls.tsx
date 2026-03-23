import React, { useState } from "react";
import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Diamond,
  StickyNote,
  Type,
  Pencil,
  Undo2,
  Redo2,
  Clock,
  Palette,
  Minus,
} from "lucide-react";
import type { Tool, BoardControlsProps } from "../../../types/board";
import { boardShell } from "../boardChromeTheme";

const presetColors = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#000000",
];

const tools: { id: Tool; label: React.ReactNode }[] = [
  { id: "select", label: <MousePointer2 size={16} /> },
  { id: "rectangle", label: <Square size={16} /> },
  { id: "circle", label: <Circle size={16} /> },
  { id: "triangle", label: <Triangle size={16} /> },
  { id: "diamond", label: <Diamond size={16} /> },
  { id: "sticky", label: <StickyNote size={16} /> },
  { id: "text", label: <Type size={16} /> },
  { id: "pen", label: <Pencil size={16} /> },
  { id: "line", label: <Minus size={16} /> },
];

type MobilePanel = "tools" | "colors" | null;

const idleButton =
  "text-gray-700 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:text-gray-200 dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]";
const activeButton =
  "bg-[#1a3a6b] text-[#f5f0e8] dark:bg-[#f7b731] dark:text-[#0a0a0a]";

export default function BoardControls({
  tool,
  setTool,
  color,
  setColor,
  onToggleActivity,
  activityOpen,
  onRedo,
  onUndo,
  strokeWidth,
  setStrokeWidth,
}: BoardControlsProps) {
  const [showTools, setShowTools] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  const toggleMobilePanel = (panel: MobilePanel) =>
    setMobilePanel((prev) => (prev === panel ? null : panel));

  const activeTool = tools.find((t) => t.id === tool);

  return (
    <>
      <div
        className={`fixed bottom-4 left-1/2 z-50 hidden max-w-[95vw] -translate-x-1/2 items-center justify-center gap-1 px-2 py-2 sm:flex ${boardShell}`}
      >
        <div className="relative flex items-center gap-1 xl:hidden">
          <button
            onClick={() => setShowTools((o) => !o)}
            title={String(activeTool?.id)}
            className={`flex h-8 w-8 items-center justify-center ${showTools ? activeButton : idleButton}`}
          >
            {activeTool?.label ?? <MousePointer2 size={16} />}
          </button>

          {showTools && (
            <div
              className={`absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 p-2 ${boardShell}`}
            >
              <div className="grid grid-cols-4 gap-1">
                {tools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTool(t.id);
                      setShowTools(false);
                    }}
                    title={t.id}
                    className={`flex h-8 w-8 items-center justify-center ${
                      tool === t.id ? activeButton : idleButton
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-1 xl:flex">
          {tools.map((t, i) => (
            <React.Fragment key={t.id}>
              {i === 1 && (
                <div className="h-5 w-px bg-[#0a0a0a]/20 dark:bg-[#f5f0e8]/20" />
              )}
              <button
                onClick={() => setTool(t.id)}
                title={t.id}
                className={`flex h-8 w-8 items-center justify-center ${
                  tool === t.id ? activeButton : idleButton
                }`}
              >
                {t.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {tool === "pen" && (
          <>
            <div className="h-5 w-px bg-[#0a0a0a]/20 dark:bg-[#f5f0e8]/20" />
            <div className="flex items-center gap-1.5">
              <span className="w-3 text-xs text-gray-400 dark:text-gray-500">W</span>
              <input
                type="range"
                min={1}
                max={20}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="h-1.5 w-16 cursor-pointer accent-[#1a3a6b] dark:accent-[#f7b731]"
              />
              <span className="w-4 text-xs text-gray-400 dark:text-gray-500">
                {strokeWidth}
              </span>
            </div>
          </>
        )}

        <div className="h-5 w-px bg-[#0a0a0a]/20 dark:bg-[#f5f0e8]/20" />

        <button
          onClick={onUndo}
          className={`flex h-8 w-8 items-center justify-center ${idleButton}`}
        >
          <Undo2 size={16} />
        </button>

        <button
          onClick={onRedo}
          className={`flex h-8 w-8 items-center justify-center ${idleButton}`}
        >
          <Redo2 size={16} />
        </button>

        <div className="h-5 w-px bg-[#0a0a0a]/20 dark:bg-[#f5f0e8]/20" />

        {presetColors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="h-5 w-5 shrink-0 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: c,
              borderColor: color === c ? "#1a3a6b" : "transparent",
            }}
          />
        ))}

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-7 cursor-pointer border-2 border-[#0a0a0a] bg-transparent dark:border-[#f5f0e8]"
        />

        <div className="h-5 w-px bg-[#0a0a0a]/20 dark:bg-[#f5f0e8]/20" />

        <button
          onClick={onToggleActivity}
          className={`flex h-8 w-8 items-center justify-center ${
            activityOpen ? activeButton : idleButton
          }`}
        >
          <Clock size={16} />
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#0a0a0a] bg-[#f5f0e8]/97 sm:hidden dark:border-[#f5f0e8] dark:bg-[#1e1e1e]/97">
        {mobilePanel === "tools" && (
          <div className="flex flex-wrap items-center justify-center gap-1 border-b-2 border-[#0a0a0a]/15 px-3 py-2 dark:border-[#f5f0e8]/15">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTool(t.id);
                  setMobilePanel(null);
                }}
                className={`flex h-9 w-9 items-center justify-center ${
                  tool === t.id ? activeButton : idleButton
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {mobilePanel === "colors" && (
          <div className="flex items-center justify-center gap-2 border-b-2 border-[#0a0a0a]/15 px-4 py-2 dark:border-[#f5f0e8]/15">
            {presetColors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setMobilePanel(null);
                }}
                className="h-8 w-8 rounded-full border-2"
                style={{
                  background: c,
                  borderColor: color === c ? "#1a3a6b" : "transparent",
                }}
              />
            ))}

            <label className={`flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[#0a0a0a] ${idleButton} dark:border-[#f5f0e8]`}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute h-0 w-0 opacity-0"
              />
              <Palette size={16} />
            </label>
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-1">
          <button
            onClick={() => toggleMobilePanel("tools")}
            className={`flex h-10 w-10 items-center justify-center ${
              mobilePanel === "tools" ? activeButton : idleButton
            }`}
          >
            {activeTool?.label ?? <MousePointer2 size={18} />}
          </button>

          <button
            onClick={onUndo}
            className={`flex h-10 w-10 items-center justify-center ${idleButton}`}
          >
            <Undo2 size={18} />
          </button>

          <button
            onClick={onRedo}
            className={`flex h-10 w-10 items-center justify-center ${idleButton}`}
          >
            <Redo2 size={18} />
          </button>

          <button
            onClick={() => toggleMobilePanel("colors")}
            className={`flex h-10 w-10 items-center justify-center ${
              mobilePanel === "colors" ? activeButton : idleButton
            }`}
          >
            <div
              className="h-6 w-6 rounded-full border-2"
              style={{
                background: color,
                borderColor: mobilePanel === "colors" ? "#f5f0e8" : "#0a0a0a",
              }}
            />
          </button>

          <button
            onClick={onToggleActivity}
            className={`flex h-10 w-10 items-center justify-center ${
              activityOpen ? activeButton : idleButton
            }`}
          >
            <Clock size={18} />
          </button>
        </div>

        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
}
