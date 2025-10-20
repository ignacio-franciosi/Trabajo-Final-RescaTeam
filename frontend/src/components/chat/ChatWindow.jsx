import { useContext, useEffect, useMemo, useRef } from 'react';
import { ChatContext } from '../../context/ChatContext';
import ChatBubble from './ChatBubble';
import ChatMessageInput from './ChatMessageInput';
import { AuthContext } from '../../context/AuthContext';
import { useAutoScroll } from '../../hooks/useAutoScroll';

export default function ChatWindow({ chatId }) {
  const { messagesByChat, sendMessage, markRead } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const msgs = messagesByChat[chatId] || [];

  // auto-scroll inteligente
  const { containerRef, atBottom, scrollToBottom, onNewContent } = useAutoScroll({ threshold: 140 });

  // Dispara autoscroll solo cuando llegan mensajes nuevos
  useEffect(() => {
    onNewContent();
  }, [msgs.length, onNewContent]);

  // Debounce para markRead (evita spam si llegan muchos mensajes rápido)
  const markTimerRef = useRef(null);
  const lastMarkedCountRef = useRef(0);

  useEffect(() => {
    // Condiciones: chat visible (pestaña activa), tenemos mensajes, y estamos razonablemente abajo
    if (document.visibilityState !== 'visible') return;
    if (msgs.length === 0) return;

    // No vuelvas a marcar si no hay diferencia respecto a la última vez
    if (lastMarkedCountRef.current === msgs.length) return;

    // Pequeño delay para “juntar” múltiples llegadas
    clearTimeout(markTimerRef.current);
    markTimerRef.current = setTimeout(async () => {
      try {
        await markRead(chatId);
        lastMarkedCountRef.current = msgs.length;
      } catch {
        // ignorar error en UI
      }
    }, 250);

    return () => clearTimeout(markTimerRef.current);
  }, [chatId, msgs.length, markRead]);

  // Botón flotante para bajar al final si el usuario scrolleó hacia arriba
  const JumpToBottomBtn = useMemo(() => {
    if (atBottom) return null;
    return (
      <button
        onClick={scrollToBottom}
        className="absolute bottom-20 right-4 bg-blue-600 text-white text-sm px-3 py-1 rounded-full shadow hover:bg-blue-700"
      >
        Ir al último
      </button>
    );
  }, [atBottom, scrollToBottom]);

  const handleSend = (text) => {
    if (!text?.trim()) return;
    sendMessage({ chatId, content: text });
    // opcional: si yo envío, scrolleo
    scrollToBottom();
  };

  return (
    <div className="h-full flex flex-col relative">
      <div ref={containerRef} className="flex-1 overflow-auto p-4 space-y-2">
        {msgs.map((m) => (
          <ChatBubble
            key={m.messageId}
            message={m}
            isMine={String(m.senderId) === String(user?.userId)}
          />
        ))}
      </div>

      {JumpToBottomBtn}

      <div className="border-t p-3">
        <ChatMessageInput onSend={handleSend} />
      </div>
    </div>
  );
}


/*

import { useContext, useEffect, useMemo, useRef } from "react";
import { ChatContext } from "../../context/ChatContext";
import ChatBubble from "./ChatBubble";
import ChatMessageInput from "./ChatMessageInput";
import { useAuth } from "../../context/AuthContext";

export default function ChatWindow({ chatId }) {
  const { user } = useAuth(); // { userId, ... }
  const myId = String(user?.userId || "");

  const { messagesByChat, sendMessage, markRead, chats, fetchMessages } =
    useContext(ChatContext);

  const msgs = messagesByChat[chatId] || [];
  const listRef = useRef(null);

  // buscar el chat para mostrar el “otro” participante en el header
  const chat = useMemo(
    () => chats.find((c) => c.chatId === chatId),
    [chats, chatId]
  );
  const otherId = useMemo(() => {
    if (!chat) return "";
    const [a, b] = chat.participants || [];
    return a === myId ? b : a;
  }, [chat, myId]);

  // cargar historial si no lo tenemos todavía
  useEffect(() => {
    if (chatId && (!msgs || msgs.length === 0)) {
      fetchMessages(chatId).catch(() => {});
    }
  }, [chatId]);

  // auto-scroll al final cuando llegan nuevos mensajes
  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 0);
  useMemo(scrollToEnd, [msgs.length]);

  // marcar como leído al abrir/cambiar chat o llegar nuevos mensajes
  useEffect(() => {
    if (chatId) markRead(chatId).catch(() => {});
  }, [chatId, msgs.length]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    sendMessage({ chatId, content: text });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header con el otro usuario */
      /*
      <div className="border-b p-3 bg-white">
        <div className="font-semibold">
          {otherId ? `Chat con Usuario ${otherId}` : "Chat"}
        </div>
        {chat?.postId ? (
          <div className="text-xs text-gray-500">Post ID: {chat.postId}</div>
        ) : null}
      </div>

      {/* Lista de mensajes */
      /*
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
        {msgs.map((m) => (
          <ChatBubble
            key={m.messageId}
            message={m}
            isMine={m.senderId === myId}
          />
        ))}
      </div>
      
      {/* Input de envío *
      <div className="border-t p-3 bg-white">
        <ChatMessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
*/ 