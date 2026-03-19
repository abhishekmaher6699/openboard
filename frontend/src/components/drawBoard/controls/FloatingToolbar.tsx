import React, { useState, useEffect } from "react";
import {
  Copy,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Ellipsis,
} from "lucide-react";
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

const ALIGN_OPTIONS: Array<{ value: "left" | "center" | "right"; icon: React.ReactNode; title: string }> = [
  { value: "left",   icon: <AlignLeft size={14} />,   title: "Align left"   },
  { value: "center", icon: <AlignCenter size={14} />, title: "Align center" },
  { value: "right",  icon: <AlignRight size={14} />,  title: "Align right"  },
];

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

  const [moreOpen, setMoreOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width < 640;

  const hasText = toolbar.types.some((t) => t === "text" || t === "sticky");
  const firstTextObj = objects.find(
    (o) => toolbar.ids.includes(o.id) && (o.type === "text" || o.type === "sticky")
  );
  const textStyle = firstTextObj?.data ?? {};
  const currentAlign: "left" | "center" | "right" = textStyle.align ?? "center";

  const TOOLBAR_WIDTH = 460;
  const clampedLeft = Math.min(
    width - TOOLBAR_WIDTH / 2 - 8,
    Math.max(TOOLBAR_WIDTH / 2 + 8, toolbar.x)
  );

  const positionStyle = isMobile
    ? { bottom: 110, left: "50%", transform: "translateX(-50%)", maxWidth: "calc(100vw - 16px)" }
    : { left: clampedLeft, top: Math.max(8, toolbar.y), transform: "translateX(-50%)" };

  return (
    <div
      className="fixed flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1 shadow-lg select-none z-9999"
      style={positionStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ToolbarButton onClick={onDuplicate} title="Duplicate">
        <Copy size={14} />
      </ToolbarButton>

      {/* Layering — always separate buttons */}
      <div className="flex gap-0.5">
        <ToolbarButton onClick={onBringToFront} title="Bring to front">
          <BringToFront size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={onBringForward} title="Bring forward">
          <ChevronUp size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={onSendBack} title="Send back">
          <ChevronDown size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={onSendToBack} title="Send to back">
          <SendToBack size={14} />
        </ToolbarButton>
      </div>

      {/* Text options */}
      {hasText && (
        <>
          <Divider />

          {/* Desktop — inline */}
          {!isMobile && (
            <>
              <select
                value={textStyle.fontFamily ?? "sans-serif"}
                onChange={(e) => onFontFamily(e.target.value)}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-gray-700 max-w-[100px]"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              <TextColorPicker
                value={firstTextObj?.data?.textColor ?? "#1a1a1a"}
                onChange={onTextColor}
              />

              <select
                value={textStyle.fontSize ?? 16}
                onChange={(e) => onFontSize(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-gray-700 w-12"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <Divider />
              <ToolbarButton onClick={onBold} title="Bold" active={textStyle.bold}>
                <Bold size={14} />
              </ToolbarButton>
              <ToolbarButton onClick={onItalic} title="Italic" active={textStyle.italic}>
                <Italic size={14} />
              </ToolbarButton>

              {/* Separate align buttons */}
              {ALIGN_OPTIONS.map(({ value, icon, title }) => (
                <ToolbarButton
                  key={value}
                  onClick={() => onAlign(value)}
                  title={title}
                  active={currentAlign === value}
                >
                  {icon}
                </ToolbarButton>
              ))}
            </>
          )}

          {/* Mobile — collapsed into dropdown */}
          {isMobile && (
            <div className="relative">
              <ToolbarButton onClick={() => setMoreOpen(o => !o)} title="More" active={moreOpen}>
                <Ellipsis size={14} />
              </ToolbarButton>
              {moreOpen && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-[10001] w-48">
                  {/* Font family */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1 px-1">Font</p>
                    <select
                      value={textStyle.fontFamily ?? "sans-serif"}
                      onChange={(e) => { onFontFamily(e.target.value); }}
                      className="w-full text-xs border border-slate-200 rounded px-1 py-1 bg-white text-gray-700"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {FONTS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font size */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1 px-1">Size</p>
                    <select
                      value={textStyle.fontSize ?? 16}
                      onChange={(e) => { onFontSize(Number(e.target.value)); }}
                      className="w-full text-xs border border-slate-200 rounded px-1 py-1 bg-white text-gray-700"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Text color */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1 px-1">Color</p>
                    <div className="px-1">
                      <TextColorPicker
                        value={firstTextObj?.data?.textColor ?? "#1a1a1a"}
                        onChange={(c) => { onTextColor(c); }}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 mb-2" />

                  {/* Bold / Italic / Separate align buttons */}
                  <div className="flex items-center gap-1 px-1">
                    <ToolbarButton onClick={() => { onBold(); }} title="Bold" active={textStyle.bold}>
                      <Bold size={14} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => { onItalic(); }} title="Italic" active={textStyle.italic}>
                      <Italic size={14} />
                    </ToolbarButton>
                    {ALIGN_OPTIONS.map(({ value, icon, title }) => (
                      <ToolbarButton
                        key={value}
                        onClick={() => { onAlign(value); }}
                        title={title}
                        active={currentAlign === value}
                      >
                        {icon}
                      </ToolbarButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Divider />
      <ToolbarButton onClick={onDelete} title="Delete" danger>
        <Trash2 size={14} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({ onClick, title, children, active, danger }: any) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-[13px] transition-colors ${
        active
          ? "bg-blue-100 text-blue-600"
          : danger
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-[10001] w-36">
      {children}
    </div>
  );
}

function MenuItem({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}