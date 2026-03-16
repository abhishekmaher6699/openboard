import { useState, useRef, useEffect } from "react"

type Props = {
  value: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  "#1a1a1a",
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#92400e",
]

export default function TextColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative" }} onPointerDown={e => e.stopPropagation()}>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Text color"
        style={{
          width: "28px",
          height: "28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          background: open ? "#f1f5f9" : "transparent",
          gap: "1px",
          padding: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
        onMouseLeave={e => (e.currentTarget.style.background = open ? "#f1f5f9" : "transparent")}
      >
        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#374151", lineHeight: 1 }}>A</span>
        <div style={{ width: "14px", height: "3px", background: value, borderRadius: "1px" }} />
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "fixed",
            transform: "translateX(-50%)",
            marginTop: "6px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 10001,
            width: "148px",
          }}
        >
          {/* Preset colors grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false) }}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  border: c === value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                  background: c,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#e2e8f0", margin: "0 0 8px" }} />

          {/* Custom color picker */}
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "#6b7280" }}>
            <input
              type="color"
              value={value}
              onChange={e => onChange(e.target.value)}
              style={{ width: "24px", height: "24px", border: "1px solid #e2e8f0", borderRadius: "4px", cursor: "pointer", padding: "1px" }}
            />
            Custom
          </label>
        </div>
      )}
    </div>
  )
}