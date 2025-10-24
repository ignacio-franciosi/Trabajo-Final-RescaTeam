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
