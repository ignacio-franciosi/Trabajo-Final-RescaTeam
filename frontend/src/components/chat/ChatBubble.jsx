import React from "react";

/**
 * Burbuja de mensaje.
 * Props:
 * - message: { senderId, content, timestamp, viewed }
 * - isMine: boolean => alinea a la derecha y cambia estilo
 */
export default function ChatBubble({ message, isMine }) {
  const ts =
    message?.timestamp ? new Date(message.timestamp) : null;

  return (
    <div className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
          isMine
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm">
          {message?.content ?? ""}
        </div>
        <div
          className={`mt-1 text-[10px] ${
            isMine ? "text-blue-100" : "text-gray-500"
          } flex items-center gap-2`}
        >
          {ts ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          {typeof message?.viewed === "boolean" && isMine ? (
            <span>{message.viewed ? "✓✓" : "✓"}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
