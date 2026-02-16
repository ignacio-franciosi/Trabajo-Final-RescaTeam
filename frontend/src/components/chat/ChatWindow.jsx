// src/components/chat/ChatWindow.jsx
import { useContext, useEffect, useMemo, useRef } from 'react';
import { ChatContext } from '../../context/ChatContext';
import ChatBubble from './ChatBubble';
import ChatMessageInput from './ChatMessageInput';
import { AuthContext } from '../../context/AuthContext';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function ChatWindow({ chatId }) {
  const {
    messagesByChat,
    sendMessage,
    markRead,
    chats,
    getChatById,
    nameMap,
    sendEvent,
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  // Chat activo enriquecido (displayName/otherId si existen)
  const activeChat = useMemo(() => {
    if (typeof getChatById === 'function') return getChatById(chatId);
    return chats.find(c => c.chatId === chatId) || null;
  }, [chatId, chats, getChatById]);

  // Derivar "otro usuario" y su nombre legible
  const myId = String(user?.userId ?? '');
  const otherId =
    activeChat?.otherId ??
    (activeChat?.participants || []).find(p => String(p) !== myId);

  const otherName =
    activeChat?.displayName ||
    (otherId ? nameMap?.[otherId] : '') ||
    otherId ||
    'Chat';

  // Mensajes del chat
  const msgs = messagesByChat[chatId] || [];

  // Auto-scroll inteligente
  const { containerRef, atBottom, scrollToBottom, onNewContent } =
    useAutoScroll({ threshold: 140 });

  useEffect(() => {
    onNewContent();
  }, [msgs.length, onNewContent]);

  useEffect(() => {
    if (typeof sendEvent === 'function' && chatId) {
      sendEvent('chat:active', { chatId });
    }
  }, [chatId, sendEvent]);

  // Al entrar a un chat específico, forzar scroll hasta el último mensaje
  useEffect(() => {
    if (!chatId) return;
    // esperar a que el contenido renderice y luego bajar
    const t = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(t);
  }, [chatId, scrollToBottom]);

  // Focus al abrir chat para que en mobile el input suba y sea visible
  const inputRef = useRef(null);
  useEffect(() => {
    if (!chatId) return;
    const t = setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch (e) {
        /* noop */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [chatId]);

  // Debounce para markRead
  const markTimerRef = useRef(null);
  const lastMarkedCountRef = useRef(0);

  useEffect(() => {
    if (document.visibilityState !== 'visible') return;
    if (msgs.length === 0) return;
    if (lastMarkedCountRef.current === msgs.length) return;

    clearTimeout(markTimerRef.current);
    markTimerRef.current = setTimeout(async () => {
      try {
        await markRead(chatId);
        lastMarkedCountRef.current = msgs.length;
      } catch {
        /* noop */
      }
    }, 250);

    return () => clearTimeout(markTimerRef.current);
  }, [chatId, msgs.length, markRead]);

  const handleSend = (text) => {
    if (!text?.trim()) return;
    sendMessage({ chatId, content: text });
    scrollToBottom();
  };

  // Avatar redondo con inicial
  const initial = (otherName || '')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="h-full flex flex-col relative bg-white">
      {/* Header del chat: nombre del otro usuario */}
      <header className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
          {initial || 'U'}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{otherName}</div>
        </div>
      </header>

      {/* Mensaje de seguridad */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <FaExclamationTriangle className="text-amber-600 text-lg" />
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-amber-900 mb-1">Recomendación de seguridad</p>
            <p>
              Por seguridad, antes de entregar o reclamar una mascota, se recomienda solicitar información que permita verificar la tenencia responsable (fotos previas, características particulares, libreta sanitaria u otra documentación).
            </p>
            <p className="mt-1 text-xs text-gray-600">
              RescaTeam solo actúa como intermediario y no valida la titularidad de los usuarios.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 space-y-2">
        {msgs.map((m, i) => {
          // key única: combina messageId, senderId, timestamp y el índice
          const key =
            m.messageId
              ? `msg-${m.messageId}-${i}`
              : `${chatId}-${m.senderId}-${m.timestamp || i}`;
          return (
            <ChatBubble
              key={key}
              message={m}
              isMine={String(m.senderId) === myId}
            />
          );
        })}
      </div>

      {/* Botón flotante para volver al final */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 bg-blue-600 text-white text-sm px-3 py-1 rounded-full shadow hover:bg-blue-700"
        >
          Ir al último
        </button>
      )}

      {/* Input de mensaje */}
      <div className="border-t px-3 py-2 md:p-3">
        <ChatMessageInput ref={inputRef} onSend={handleSend} />
      </div>
    </div>
  );
}
