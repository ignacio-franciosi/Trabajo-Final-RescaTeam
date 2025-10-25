// src/components/chat/ChatList.jsx
import React from "react";

export default function ChatList({
  chats = [],
  selectedChatId = null,
  onSelect,
  currentUserId,
  getUnreadCount,
}) {
  if (!Array.isArray(chats)) chats = [];

  return (
    <aside className=" h-full flex flex-col">

      <ul className="divide-y divide-gray-100">
        {chats.length === 0 && (
          <li className="p-4 text-sm text-gray-500">No tenés chats todavía.</li>
        )}

        {chats.map((ch) => {
          const isActive = ch.chatId === selectedChatId;

          let title = ch.displayName || 'Chat';
          if (!ch.displayName && currentUserId && Array.isArray(ch.participants)) {
            const other =
              ch.participants.find((p) => String(p) !== String(currentUserId)) ??
              ch.participants[0];
            title = other || 'Chat';
          }

          return (
            <li
              key={ch.chatId}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${isActive ? "bg-blue-50" : ""}`}
              onClick={() => onSelect && onSelect(ch.chatId)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{title}</div>
                  {ch.lastMessage ? (
                    <div className="mt-1 text-sm text-gray-700 line-clamp-1">
                      {ch.lastMessage}
                    </div>
                  ) : null}
                </div>
                {ch.lastUpdate ? (
                  <time
                    className="ml-3 text-[11px] text-gray-400 whitespace-nowrap"
                    dateTime={ch.lastUpdate}
                    title={new Date(ch.lastUpdate).toLocaleString()}
                  >
                    {new Date(ch.lastUpdate).toLocaleDateString()}
                  </time>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
