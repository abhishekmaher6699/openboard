import { useState } from "react";

export interface ChatMessage {
  id: string;
  userId: number;
  username: string;
  text: string;
  reactions: Record<string, number[]>; // emoji -> userIds
}

export function useChat(currentUserId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const onChatMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const onReaction = (messageId: string, emoji: string, userId: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const current = m.reactions[emoji] ?? [];
        const already = current.includes(userId);
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: already
              ? current.filter((id) => id !== userId)
              : [...current, userId],
          },
        };
      })
    );
  };

  return { messages, onChatMessage, onReaction };
}