import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import type { ChatMessage } from "../../../hooks/board/chat/useChat";
import { getUserColor } from "../../../lib/activityUtils";
import { boardCard } from "../boardChromeTheme";

const EMOJIS = ["👍", "❤", "😂", "😮", "👏"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: number | null;
  onSend: (text: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

export default function ChatPanel({
  isOpen,
  onClose,
  messages,
  currentUserId,
  onSend,
  onReaction,
}: Props) {
  const [input, setInput] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed bottom-20 right-4 z-[9999] flex w-80 max-w-[calc(100vw-1rem)] origin-bottom-right flex-col transition-all duration-300 ${boardCard} ${
        isOpen
          ? "pointer-events-auto scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0"
      }`}
      style={{ maxHeight: "60vh" }}
    >
      <div className="flex shrink-0 items-center justify-between border-b-2 border-[#0a0a0a]/15 px-4 py-3 dark:border-[#f5f0e8]/15">
        <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">
          Chat
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 transition-colors hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-gray-500">
            No messages yet. Say hi.
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          const color = getUserColor(msg.username);

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => setHoveredMsg(null)}
            >
              {!isMe && (
                <span className="px-1 text-[11px] font-medium" style={{ color }}>
                  {msg.username}
                </span>
              )}

              <div className="relative flex items-end gap-1">
                <div
                  className={`max-w-[220px] break-words px-3 py-2 text-sm leading-snug ${
                    isMe
                      ? "bg-[#1a3a6b] text-white dark:bg-[#f7b731] dark:text-[#0a0a0a]"
                      : "bg-slate-100 text-slate-800 dark:bg-neutral-700 dark:text-gray-100"
                  }`}
                >
                  {msg.text}
                </div>

                {hoveredMsg === msg.id && (
                  <div
                    className={`absolute ${
                      isMe ? "right-full mr-2" : "left-full ml-2"
                    } bottom-0 z-10 flex gap-1 border-2 border-[#0a0a0a] bg-white px-2 py-1 dark:border-[#f5f0e8] dark:bg-neutral-800`}
                  >
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className="text-sm transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {Object.entries(msg.reactions).some(([, ids]) => ids.length > 0) && (
                <div className="flex flex-wrap gap-1 px-1">
                  {Object.entries(msg.reactions).map(([emoji, userIds]) =>
                    userIds.length > 0 ? (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className={`flex items-center gap-0.5 border px-1.5 py-0.5 text-xs transition-colors ${
                          userIds.includes(currentUserId ?? -1)
                            ? "border-[#1a3a6b] bg-[#1a3a6b]/10 dark:border-[#f7b731] dark:bg-[#f7b731]/10"
                            : "border-slate-200 bg-slate-100 dark:border-neutral-600 dark:bg-neutral-700"
                        }`}
                      >
                        {emoji} {userIds.length}
                      </button>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="flex shrink-0 items-end gap-2 border-t-2 border-[#0a0a0a]/15 px-3 py-3 dark:border-[#f5f0e8]/15">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-[#1a3a6b] dark:border-[#f5f0e8] dark:bg-neutral-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-[#f7b731]"
          style={{ maxHeight: 80 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white transition-colors hover:bg-[#d62828] disabled:opacity-40 dark:border-[#f5f0e8] dark:bg-[#f5f0e8] dark:text-[#0a0a0a] dark:hover:bg-[#f7b731]"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
