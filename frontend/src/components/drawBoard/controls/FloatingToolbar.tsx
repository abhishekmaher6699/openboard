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
  const currentAlign = textStyle.align ?? "center";

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
      className="fixed flex items-center gap-0.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-1.5 py-1 shadow-lg select-none z-9999"
      style={positionStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ToolbarButton onClick={onDuplicate} title="Duplicate">
        <Copy size={14} />
      </ToolbarButton>

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

      {hasText && (
        <>
          <Divider />

          {!isMobile && (
            <>
              <select
                value={textStyle.fontFamily ?? "sans-serif"}
                onChange={(e) => onFontFamily(e.target.value)}
                className="text-xs border border-slate-200 dark:border-neutral-700 rounded px-1 py-0.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 max-w-25"
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
                className="text-xs border border-slate-200 dark:border-neutral-700 rounded px-1 py-0.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 w-12"
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

          {isMobile && (
            <div className="relative">
              <ToolbarButton onClick={() => setMoreOpen(o => !o)} title="More" active={moreOpen}>
                <Ellipsis size={14} />
              </ToolbarButton>

              {moreOpen && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10001 w-48">

                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">Font</p>
                    <select
                      value={textStyle.fontFamily ?? "sans-serif"}
                      onChange={(e) => onFontFamily(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-neutral-700 rounded px-1 py-1 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
                    >
                      {FONTS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">Size</p>
                    <select
                      value={textStyle.fontSize ?? 16}
                      onChange={(e) => onFontSize(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 dark:border-neutral-700 rounded px-1 py-1 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200"
                    >
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">Color</p>
                    <div className="px-1">
                      <TextColorPicker
                        value={firstTextObj?.data?.textColor ?? "#1a1a1a"}
                        onChange={onTextColor}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-neutral-700 mb-2" />

                  <div className="flex items-center gap-1 px-1">
                    <ToolbarButton onClick={onBold} title="Bold" active={textStyle.bold}>
                      <Bold size={14} />
                    </ToolbarButton>
                    <ToolbarButton onClick={onItalic} title="Italic" active={textStyle.italic}>
                      <Italic size={14} />
                    </ToolbarButton>
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
          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
          : danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          : "text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700 mx-0.5" />;
}

