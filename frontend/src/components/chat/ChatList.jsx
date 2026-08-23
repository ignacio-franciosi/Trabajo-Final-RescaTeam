// src/components/chat/ChatList.jsx
import React, { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";

export default function ChatList({
  chats = [],
  selectedChatId = null,
  onSelect,
  currentUserId,
  getUnreadCount,
  nameMap = {},
}) {
  const { unreadByChat } = useContext(ChatContext);

  if (!Array.isArray(chats)) chats = [];

  return (
    <aside className="h-full flex flex-col">
      <ul className="divide-y divide-gray-100">
        {chats.length === 0 && (
          <li className="p-4 text-sm text-gray-500">No tenés chats todavía.</li>
        )}

        {chats.map((ch) => {
          const isActive = ch.chatId === selectedChatId;

          // Determinar “otro usuario” y un título legible
          let otherId = null;
          if (currentUserId && Array.isArray(ch.participants)) {
            otherId =
              ch.participants.find((p) => String(p) !== String(currentUserId)) ??
              ch.participants[0] ??
              null;
          }
          const fallbackOther = otherId ?? (ch.participants?.[0] ?? "-");
          const display = ch.displayName || nameMap[fallbackOther] || fallbackOther;
          const title = display || "Chat";

          // No leídos
          const unread =
            typeof getUnreadCount === "function"
              ? getUnreadCount(ch.chatId)
              : (unreadByChat?.[ch.chatId] ?? 0);

          return (
            <li
              key={ch.chatId}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                isActive ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelect && onSelect(ch.chatId)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {title}
                  </div>
                  {ch.lastMessage ? (
                    <div className="mt-1 text-sm text-gray-700 line-clamp-1">
                      {ch.lastMessage}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col items-end shrink-0">
                  {ch.lastUpdate ? (
                    <time
                      className="text-[11px] text-gray-400 whitespace-nowrap"
                      dateTime={ch.lastUpdate}
                      title={new Date(ch.lastUpdate).toLocaleString()}
                    >
                      {new Date(ch.lastUpdate).toLocaleDateString()}
                    </time>
                  ) : (
                    <span className="h-[14px]" />
                  )}

                  {unread > 0 && (
                    <span className="mt-1 inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-semibold">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
