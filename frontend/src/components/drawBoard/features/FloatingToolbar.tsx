import React from "react"
import TextColorPicker from "./Textcolorpicker"
import type { ToolbarState } from "../canvas/interaction/useFloatingtoolbar"
import type { BoardObject } from "../../../types/board"

type Props = {
  toolbar: ToolbarState
  objects: BoardObject[]
  onDelete: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBack: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onBold: () => void
  onItalic: () => void
  onFontSize: (size: number) => void
  onAlign: (align: "left" | "center" | "right") => void
  onFontFamily: (font: string) => void
  onTextColor: (color: string) => void
}

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48]

const FONTS = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Comic Sans MS", value: "Comic Sans MS, cursive" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Garamond", value: "Garamond, serif" },
]

export default function FloatingToolbar({
  toolbar,
  objects,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBack,
  onBringToFront,
  onSendToBack,
  onBold,
  onItalic,
  onFontSize,
  onAlign,
  onFontFamily,
  onTextColor,
}: Props) {
  if (!toolbar.visible) return null

  const hasText = toolbar.types.some(t => t === "text" || t === "sticky")

  const firstTextObj = objects.find(o =>
    toolbar.ids.includes(o.id) && (o.type === "text" || o.type === "sticky")
  )
  const textStyle = firstTextObj?.data ?? {}

  return (
    <div
      style={{
        position: "fixed",
        left: toolbar.x,
        top: Math.max(8, toolbar.y),
        transform: "translateX(-50%)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "4px 6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Object actions */}
      <ToolbarButton onClick={onDuplicate} title="Duplicate">⧉</ToolbarButton>
      <ToolbarButton onClick={onBringToFront} title="Bring to front">⇑</ToolbarButton>
      <ToolbarButton onClick={onBringForward} title="Bring forward">↑</ToolbarButton>
      <ToolbarButton onClick={onSendBack} title="Send back">↓</ToolbarButton>
      <ToolbarButton onClick={onSendToBack} title="Send to back">⇓</ToolbarButton>

      {/* Text styling */}
      {hasText && (
        <>
          <Divider />

          {/* Font family */}
          <select
            value={textStyle.fontFamily ?? "sans-serif"}
            onChange={e => onFontFamily(e.target.value)}
            style={selectStyle}
            onPointerDown={e => e.stopPropagation()}
          >
            {FONTS.map(f => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Text color */}
          <TextColorPicker
            value={firstTextObj?.data?.textColor ?? "#1a1a1a"}
            onChange={onTextColor}
          />

          {/* Font size */}
          <select
            value={textStyle.fontSize ?? 16}
            onChange={e => onFontSize(Number(e.target.value))}
            style={selectStyle}
            onPointerDown={e => e.stopPropagation()}
          >
            {FONT_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <Divider />

          <ToolbarButton onClick={onBold} title="Bold" active={textStyle.bold} style={{ fontWeight: "bold" }}>B</ToolbarButton>
          <ToolbarButton onClick={onItalic} title="Italic" active={textStyle.italic} style={{ fontStyle: "italic" }}>I</ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => onAlign("left")} title="Align left" active={textStyle.align === "left"}>
            <AlignIcon align="left" />
          </ToolbarButton>
          <ToolbarButton onClick={() => onAlign("center")} title="Align center" active={!textStyle.align || textStyle.align === "center"}>
            <AlignIcon align="center" />
          </ToolbarButton>
          <ToolbarButton onClick={() => onAlign("right")} title="Align right" active={textStyle.align === "right"}>
            <AlignIcon align="right" />
          </ToolbarButton>
        </>
      )}

      <Divider />
      <ToolbarButton onClick={onDelete} title="Delete" danger>🗑</ToolbarButton>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  fontSize: "12px",
  border: "1px solid #e2e8f0",
  borderRadius: "4px",
  padding: "2px 4px",
  cursor: "pointer",
  outline: "none",
  background: "white",
  color: "#374151",
  maxWidth: "120px",
}

function AlignIcon({ align }: { align: "left" | "center" | "right" }) {
  const lines = [14, 10, 12]
  return (
    <svg width="14" height="12" viewBox="0 0 14 12">
      {lines.map((w, i) => {
        const x = align === "left" ? 0 : align === "right" ? 14 - w : (14 - w) / 2
        return <rect key={i} x={x} y={i * 4} width={w} height={2} rx={1} fill="currentColor" />
      })}
    </svg>
  )
}

function ToolbarButton({
  onClick, title, children, active, danger, style,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
  danger?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "13px",
        background: active ? "#dbeafe" : "transparent",
        color: danger ? "#ef4444" : active ? "#2563eb" : "#374151",
        transition: "background 0.1s",
        ...style,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = danger ? "#fee2e2" : "#f1f5f9" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "#dbeafe" : "transparent" }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 2px" }} />
}