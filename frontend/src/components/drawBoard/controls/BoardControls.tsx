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
} from "lucide-react";
import type { Tool, BoardControlsProps } from "../../../types/board";

const presetColors = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#000000",
];

const tools: { id: Tool; label: React.ReactNode }[] = [
  { id: "select",    label: <MousePointer2 size={16} /> },
  { id: "rectangle", label: <Square size={16} /> },
  { id: "circle",    label: <Circle size={16} /> },
  { id: "triangle",  label: <Triangle size={16} /> },
  { id: "diamond",   label: <Diamond size={16} /> },
  { id: "sticky",    label: <StickyNote size={16} /> },
  { id: "text",      label: <Type size={16} /> },
  { id: "pen",       label: <Pencil size={16} /> },
];

type MobilePanel = "tools" | "colors" | null;

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
      {/* ── Desktop toolbar ── */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-1 bg-white shadow-xl rounded-xl px-3 py-2 border z-50 max-w-[95vw] justify-center">

        {/* Tool picker — grid popup on medium screens */}
        <div className="flex items-center gap-1 xl:hidden relative">
          <button
            onClick={() => setShowTools(o => !o)}
            title={String(activeTool?.id)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              showTools ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {activeTool?.label ?? <MousePointer2 size={16} />}
          </button>
          {showTools && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 w-max">
              <div className="grid grid-cols-4 gap-1">
                {tools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTool(t.id); setShowTools(false); }}
                    title={t.id}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                      tool === t.id ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full tool list — visible on xl+ */}
        <div className="hidden xl:flex items-center gap-1">
          {tools.map((t, i) => (
            <React.Fragment key={t.id}>
              {i === 1 && <div className="w-px h-6 bg-gray-200" />}
              <button
                onClick={() => setTool(t.id)}
                title={t.id}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  tool === t.id ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {tool === "pen" && (
          <>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">W</span>
              <input
                type="range"
                min={1}
                max={20}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16 h-1.5 accent-blue-500 cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-4">{strokeWidth}</span>
            </div>
          </>
        )}

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {presetColors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
            style={{
              background: c,
              borderColor: color === c ? "#3b82f6" : "transparent",
            }}
          />
        ))}

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-7 h-7 border rounded cursor-pointer"
        />

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onToggleActivity}
          title="Activity history"
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            activityOpen ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Clock size={16} />
        </button>
      </div>

      {/* ── Mobile toolbar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">

        {/* Tool expandable row */}
        {mobilePanel === "tools" && (
          <div className="flex items-center justify-center flex-wrap gap-1 px-3 py-2 border-b">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTool(t.id); setMobilePanel(null); }}
                title={t.id}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  tool === t.id ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Pen stroke width row */}
        {tool === "pen" && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-b">
            <span className="text-xs text-gray-400">Width</span>
            <input
              type="range"
              min={1}
              max={20}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-32 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-4">{strokeWidth}</span>
          </div>
        )}

        {/* Color row */}
        {mobilePanel === "colors" && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-b">
            {presetColors.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setMobilePanel(null); }}
                className="w-8 h-8 rounded-full border-2 shrink-0"
                style={{
                  background: c,
                  borderColor: color === c ? "#3b82f6" : "transparent",
                }}
              />
            ))}
            <label className="w-8 h-8 border rounded cursor-pointer flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="opacity-0 absolute w-0 h-0"
              />
              <Palette size={16} />
            </label>
          </div>
        )}

        {/* Main mobile action row */}
        <div className="flex items-center justify-around px-2 py-1">

          <button
            onClick={() => toggleMobilePanel("tools")}
            className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
              mobilePanel === "tools" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {activeTool?.label ?? <MousePointer2 size={18} />}
          </button>

          <button
            onClick={onUndo}
            className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            <Undo2 size={18} />
          </button>

          <button
            onClick={onRedo}
            className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            <Redo2 size={18} />
          </button>

          <button
            onClick={() => toggleMobilePanel("colors")}
            className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
              mobilePanel === "colors" ? "bg-blue-100" : ""
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{
                background: color,
                borderColor: mobilePanel === "colors" ? "#3b82f6" : "#d1d5db",
              }}
            />
          </button>

          <button
            onClick={onToggleActivity}
            className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
              activityOpen ? "bg-blue-500 text-white" : "text-gray-700"
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