import React, { useState } from "react";
import type { Tool, BoardControlsProps } from "../../../types/board";


const presetColors = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#000000",
];

const tools: { id: Tool; label: string }[] = [
  { id: "select", label: "↖" },
  { id: "rectangle", label: "▭" },
  { id: "circle", label: "◯" },
  { id: "triangle", label: "▲" },
  { id: "diamond", label: "◆" },
  { id: "sticky", label: "🗒" },
  { id: "text", label: "T" },
];

export default function BoardControls({
  tool,
  setTool,
  color,
  setColor,
  onToggleActivity,
  activityOpen,
  onRedo,
  onUndo
}: BoardControlsProps) {
  const [showColors, setShowColors] = useState(false);

  return (
    <>
      {/* ── Desktop toolbar ── */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-2 bg-white shadow-xl rounded-xl px-4 py-2 border z-50">
        {tools.map((t, i) => (
          <React.Fragment key={t.id}>
            {i === 1 && <div className="w-px h-6 bg-gray-200" />}
            <button
              onClick={() => setTool(t.id)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                tool === t.id
                  ? "bg-blue-500 text-white"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          </React.Fragment>
        ))}

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="px-3 py-2 rounded text-sm font-medium transition-colors text-black hover:bg-gray-100"
        >
          ↩
        </button>
        <button
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="px-3 py-2 rounded text-sm font-medium transition-colors text-black hover:bg-gray-100"
        >
          ↪
        </button>

        {presetColors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
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
          className="w-8 h-8 border rounded cursor-pointer"
        />

        <div className="w-px h-6 bg-gray-200" />

        {/* Activity history toggle */}
        <button
          onClick={onToggleActivity}
          title="Activity history"
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            activityOpen
              ? "bg-blue-500 text-white"
              : "text-black hover:bg-gray-100"
          }`}
        >
          ⏱
        </button>
      </div>

      {/* ── Mobile toolbar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        {showColors && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-b">
            {presetColors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setShowColors(false);
                }}
                className="w-9 h-9 rounded-full border-2 shrink-0"
                style={{
                  background: c,
                  borderColor: color === c ? "#3b82f6" : "transparent",
                }}
              />
            ))}
            <label className="w-9 h-9 border rounded cursor-pointer overflow-hidden flex items-center justify-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="opacity-0 absolute"
              />
              <span className="text-lg">🎨</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center justify-center w-11 h-11 rounded-lg text-base font-medium transition-colors ${
                tool === t.id ? "bg-blue-500 text-white" : "text-black"
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            onClick={() => setShowColors((o) => !o)}
            className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
              showColors ? "bg-blue-500" : ""
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{
                background: color,
                borderColor: showColors ? "white" : "#d1d5db",
              }}
            />
          </button>

          {/* Activity toggle on mobile */}
          <button
            onClick={onToggleActivity}
            className={`flex items-center justify-center w-11 h-11 rounded-lg text-base transition-colors ${
              activityOpen ? "bg-blue-500 text-white" : "text-black"
            }`}
          >
            ⏱
          </button>
        </div>

        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
}
