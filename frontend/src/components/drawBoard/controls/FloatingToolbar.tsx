import React, { useState } from "react";
import TextColorPicker from "./Textcolorpicker";
import type { FloatingToolBarProps } from "../../../types/canvas";

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48];
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
];

const ALIGN_CYCLE: Array<"left" | "center" | "right"> = [
  "left",
  "center",
  "right",
];
const ALIGN_ICONS: Record<string, string> = {
  left: "⬅",
  center: "↔",
  right: "➡",
};

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
}: FloatingToolBarProps) {
  if (!toolbar.visible) return null;

  const [layerOpen, setLayerOpen] = useState(false);
  const isMobile = window.innerWidth < 640;

  const hasText = toolbar.types.some((t) => t === "text" || t === "sticky");
  const firstTextObj = objects.find(
    (o) =>
      toolbar.ids.includes(o.id) && (o.type === "text" || o.type === "sticky"),
  );
  const textStyle = firstTextObj?.data ?? {};
  const currentAlign: "left" | "center" | "right" = textStyle.align ?? "center";
  const nextAlign =
    ALIGN_CYCLE[(ALIGN_CYCLE.indexOf(currentAlign) + 1) % ALIGN_CYCLE.length];

  const TOOLBAR_WIDTH = 460; // adjust approx width

  const clampedLeft = Math.min(
    window.innerWidth - TOOLBAR_WIDTH / 2 - 8,
    Math.max(TOOLBAR_WIDTH / 2 + 8, toolbar.x),
  );

  const positionStyle = isMobile
    ? { bottom: 80, left: "50%", transform: "translateX(-50%)" }
    : {
        left: clampedLeft,
        top: Math.max(8, toolbar.y),
        transform: "translateX(-50%)",
      };

  return (
    <div
      className="fixed flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1 shadow-lg select-none z-10000"
      style={positionStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ToolbarButton onClick={onDuplicate} title="Duplicate">
        ⧉
      </ToolbarButton>

      {/* Layering — dropdown on mobile, inline on desktop */}
      <div className="relative">
        {/* Mobile: dropdown */}
        <div className="sm:hidden">
          <ToolbarButton
            onClick={() => setLayerOpen((o) => !o)}
            title="Layer"
            active={layerOpen}
          >
            ⊡
          </ToolbarButton>
          {layerOpen && (
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-[10001] w-36">
              {[
                { label: "Bring to Front", action: onBringToFront, icon: "⇑" },
                { label: "Bring Forward", action: onBringForward, icon: "↑" },
                { label: "Send Back", action: onSendBack, icon: "↓" },
                { label: "Send to Back", action: onSendToBack, icon: "⇓" },
              ].map(({ label, action, icon }) => (
                <button
                  key={label}
                  onClick={() => {
                    action();
                    setLayerOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: inline buttons */}
        <div className="hidden sm:flex items-center gap-0.5">
          <ToolbarButton onClick={onBringToFront} title="Bring to front">
            ⇑
          </ToolbarButton>
          <ToolbarButton onClick={onBringForward} title="Bring forward">
            ↑
          </ToolbarButton>
          <ToolbarButton onClick={onSendBack} title="Send back">
            ↓
          </ToolbarButton>
          <ToolbarButton onClick={onSendToBack} title="Send to back">
            ⇓
          </ToolbarButton>
        </div>
      </div>

      {hasText && (
        <>
          <Divider />

          {/* Font family — hidden on mobile */}
          <select
            value={textStyle.fontFamily ?? "sans-serif"}
            onChange={(e) => onFontFamily(e.target.value)}
            className="text-xs border border-slate-200 rounded px-1 py-0.5 cursor-pointer outline-none bg-white text-gray-700 max-w-17.5px sm:max-w-25"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <TextColorPicker
            value={firstTextObj?.data?.textColor ?? "#1a1a1a"}
            onChange={onTextColor}
          />

          {/* Font size */}
          <select
            value={textStyle.fontSize ?? 16}
            onChange={(e) => onFontSize(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded px-1 py-0.5 cursor-pointer outline-none bg-white text-gray-700 w-12"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <Divider />
          <ToolbarButton
            onClick={onBold}
            title="Bold"
            active={textStyle.bold}
            className="font-bold"
          >
            B
          </ToolbarButton>
          <ToolbarButton
            onClick={onItalic}
            title="Italic"
            active={textStyle.italic}
            className="italic"
          >
            I
          </ToolbarButton>

          {/* Alignment cycle button */}
          <ToolbarButton
            onClick={() => onAlign(nextAlign)}
            title={`Align ${nextAlign}`}
            active={false}
          >
            {ALIGN_ICONS[currentAlign]}
          </ToolbarButton>
        </>
      )}

      <Divider />
      <ToolbarButton onClick={onDelete} title="Delete" danger>
        🗑
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
  active,
  danger,
  className,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center border-none rounded cursor-pointer text-[13px] transition-colors ${
        active
          ? "bg-blue-100 text-blue-600"
          : danger
            ? "text-red-500 hover:bg-red-50"
            : "text-gray-700 hover:bg-slate-100"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}
