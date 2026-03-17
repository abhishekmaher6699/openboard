
type Props = {
  label: string
  onRestore: () => void
  onExit: () => void
}

export default function PreviewBanner({ label, onRestore, onExit }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "44px",
        background: "#1a1a1a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        zIndex: 10001,
        fontSize: "13px",
      }}
    >
      <span style={{ color: "#9ca3af" }}>Viewing history —</span>
      <span style={{ fontWeight: 500 }}>{label}</span>

      <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
        <button
          onClick={onRestore}
          style={{
            padding: "4px 12px",
            background: "white",
            color: "#1a1a1a",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          Restore this state
        </button>
        <button
          onClick={onExit}
          style={{
            padding: "4px 12px",
            background: "transparent",
            color: "#9ca3af",
            border: "1px solid #374151",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Exit
        </button>
      </div>
    </div>
  )
}