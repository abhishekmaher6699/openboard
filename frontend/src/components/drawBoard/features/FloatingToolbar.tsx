import React from "react"
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
  // text styling
  onBold: () => void
  onItalic: () => void
  onFontSize: (size: number) => void
  onAlign: (align: "left" | "center" | "right") => void
}

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48]

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
}: Props) {
  if (!toolbar.visible) return null

  const allText = toolbar.types.every(t => t === "text")
  const hasText = toolbar.types.some(t => t === "text")
  const mixed = toolbar.ids.length > 1

  // get text style from first selected text object
  const firstTextObj = objects.find(o => toolbar.ids.includes(o.id) && o.type === "text")
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
      {/* Always visible actions */}
      <ToolbarButton onClick={onDuplicate} title="Duplicate">⧉</ToolbarButton>
      <ToolbarButton onClick={onBringToFront} title="Bring to front">⇑</ToolbarButton>
      <ToolbarButton onClick={onBringForward} title="Bring forward">↑</ToolbarButton>
      <ToolbarButton onClick={onSendBack} title="Send back">↓</ToolbarButton>
      <ToolbarButton onClick={onSendToBack} title="Send to back">⇓</ToolbarButton>
      <Divider />

      {/* Text styling — shown when any text object is selected */}
      {hasText && (
        <>
          <ToolbarButton
            onClick={onBold}
            title="Bold"
            active={textStyle.bold}
            style={{ fontWeight: "bold" }}
          >
            B
          </ToolbarButton>
          <ToolbarButton
            onClick={onItalic}
            title="Italic"
            active={textStyle.italic}
            style={{ fontStyle: "italic" }}
          >
            I
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={() => onAlign("left")} title="Align left" active={textStyle.align === "left"}>≡</ToolbarButton>
          <ToolbarButton onClick={() => onAlign("center")} title="Align center" active={!textStyle.align || textStyle.align === "center"}>≡</ToolbarButton>
          <ToolbarButton onClick={() => onAlign("right")} title="Align right" active={textStyle.align === "right"}>≡</ToolbarButton>
          <Divider />
          <select
            value={textStyle.fontSize ?? 16}
            onChange={e => onFontSize(Number(e.target.value))}
            style={{
              fontSize: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "2px 4px",
              cursor: "pointer",
              outline: "none",
            }}
            onPointerDown={e => e.stopPropagation()}
          >
            {FONT_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Divider />
        </>
      )}

      {/* Delete — always last */}
      <ToolbarButton onClick={onDelete} title="Delete" danger>🗑</ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  children,
  active,
  danger,
  style,
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
      onMouseEnter={e => {
        if (!active) (e.target as HTMLElement).style.background = danger ? "#fee2e2" : "#f1f5f9"
      }}
      onMouseLeave={e => {
        (e.target as HTMLElement).style.background = active ? "#dbeafe" : "transparent"
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 2px" }} />
}