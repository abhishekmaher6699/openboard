import React from "react"
import type { Tool } from "../../../types/board"

type Props = {
  tool: Tool
  setTool: React.Dispatch<React.SetStateAction<Tool>>
  color: string
  setColor: (color: string) => void
}

const presetColors = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#000000",
]

export default function BoardControls({ tool, setTool, color, setColor }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white shadow-xl rounded-xl px-4 py-2 border">

      {/* Select */}
      <button
        onClick={() => setTool("select")}
        className={`px-3 py-2 rounded ${tool === "select" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        ↖
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Shape Tools */}
      <button
        onClick={() => setTool("rectangle")}
        className={`px-3 py-2 rounded ${tool === "rectangle" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        ▭
      </button>

      <button
        onClick={() => setTool("circle")}
        className={`px-3 py-2 rounded ${tool === "circle" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        ◯
      </button>

      <button
        onClick={() => setTool("triangle")}
        className={`px-3 py-2 rounded ${tool === "triangle" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        ▲
      </button>

      <button
        onClick={() => setTool("diamond")}
        className={`px-3 py-2 rounded ${tool === "diamond" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        ◆
      </button>

      <button
        onClick={() => setTool("sticky")}
        className={`px-3 py-2 rounded ${tool === "sticky" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
      >
        🗒
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Color Presets */}
      {presetColors.map((c) => (
        <button
          key={c}
          onClick={() => setColor(c)}
          className="w-6 h-6 rounded-full border"
          style={{ background: c }}
        />
      ))}

      {/* Color Picker */}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-8 h-8 border rounded cursor-pointer"
      />

    </div>
  )
}