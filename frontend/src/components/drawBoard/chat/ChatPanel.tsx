import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import type { ChatMessage } from "../../../hooks/board/chat/useChat";
import { getUserColor } from "../../../lib/activityUtils";

const EMOJIS = ["👍", "❤️", "😂", "😮", "👏"];

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
      className={`fixed bottom-20 right-6 z-[9999] w-80 flex flex-col bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right ${
        isOpen
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={{ maxHeight: "60vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-neutral-700 shrink-0">
        <span className="font-semibold text-sm text-slate-700 dark:text-gray-200">
          Chat
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-gray-500 text-center mt-4">
            No messages yet. Say hi! 👋
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
                <span className="text-[11px] font-medium px-1" style={{ color }}>
                  {msg.username}
                </span>
              )}

              <div className="relative flex items-end gap-1">
                {/* Bubble */}
                <div
                  className={`max-w-[220px] px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-neutral-700 text-slate-800 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Emoji picker on hover */}
                {hoveredMsg === msg.id && (
                  <div
                    className={`absolute ${
                      isMe ? "right-full mr-2" : "left-full ml-2"
                    } bottom-0 flex gap-1 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-full px-2 py-1 shadow-lg z-10`}
                  >
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className="text-sm hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reactions */}
              {Object.entries(msg.reactions).some(([, ids]) => ids.length > 0) && (
                <div className="flex flex-wrap gap-1 px-1">
                  {Object.entries(msg.reactions).map(([emoji, userIds]) =>
                    userIds.length > 0 ? (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                          userIds.includes(currentUserId ?? -1)
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
                            : "bg-slate-100 dark:bg-neutral-700 border-slate-200 dark:border-neutral-600"
                        }`}
                      >
                        {emoji} {userIds.length}
                      </button>
                    ) : null
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t dark:border-neutral-700 flex items-end gap-2 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 resize-none bg-slate-100 dark:bg-neutral-700 text-sm text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          style={{ maxHeight: 80 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 transition-colors shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}