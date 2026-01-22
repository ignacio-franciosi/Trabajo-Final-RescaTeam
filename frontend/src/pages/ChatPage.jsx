// src/pages/ChatPage.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import ChatPostPanel from '../components/chat/ChatPostPanel';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const navigate = useNavigate();
  const { chats, fetchMessages, nameMap, getChatById, setActiveChat, unreadByChat } = useContext(ChatContext);
  const { user } = useAuth();

  const [activeId, setActiveId] = useState(paramChatId || null);

  useEffect(() => { if (paramChatId) setActiveId(paramChatId); }, [paramChatId]);
  // cada vez que cambia el activo → avisar al contexto y cargar mensajes
  useEffect(() => {
    if (!activeId) return;
    setActiveChat(activeId);
  }, [activeId, setActiveChat]);

  const activeChat = useMemo(
    () => (activeId && typeof getChatById === 'function' ? getChatById(activeId) : null),
    [activeId, getChatById]
  );
  const postId = activeChat?.postId || null;

  // Botón "Volver" visible sólo en mobile para regresar al listado general
  const MobileBackBar = (
    <div className="md:hidden border-b px-3 py-2 flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
      >
        ← Volver
      </button>
      <span className="text-sm text-gray-600">Mensajes</span>
    </div>
  );

  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    const update = () => {
      const h = document.querySelector('header')?.offsetHeight ?? 80;
      setHeaderHeight(h);
    };
    update();
    window.addEventListener('resize', update);
    const headerEl = document.querySelector('header');
    const mo = headerEl ? new MutationObserver(update) : null;
    if (mo && headerEl) mo.observe(headerEl, { attributes: true, childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', update);
      if (mo) mo.disconnect();
    };
  }, []);

  return (
    // altura calculada dinámicamente según el header
    <div style={{ height: `calc(100vh - ${headerHeight}px)` }} className="grid grid-cols-1 md:grid-cols-12">
      {/* Columna izquierda: lista (oculta en mobile) */}
      <div className="hidden md:block md:col-span-3 border-r overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Mis chats</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <ChatList
              chats={chats}
              selectedChatId={activeId}
              onSelect={setActiveId}
              currentUserId={String(user?.userId ?? '')}
              nameMap={nameMap}
              unreadByChat={unreadByChat}
            />
          </div>
        </div>
      </div>

      {/* Columna central: ventana de chat */}
      <div className="col-span-1 md:col-span-9 lg:col-span-6 overflow-hidden flex flex-col min-h-0">
        {/* Barra superior en mobile */}
        {MobileBackBar}
        {/* Chat list visible en mobile encima de la ventana */}
        <div className="md:hidden border-b">
          <div className="max-h-56 overflow-auto">
            <ChatList
              chats={chats}
              selectedChatId={activeId}
              onSelect={setActiveId}
              currentUserId={String(user?.userId ?? '')}
              nameMap={nameMap}
              getUnreadCount={(id) => unreadByChat?.[id] ?? 0}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {activeId
            ? <ChatWindow chatId={activeId} />
            : <div className="p-6 text-gray-500">Selecciona un chat</div>}
        </div>
      </div>

      {/* Columna derecha: card del post (sólo en lg+) */}
      <div className="hidden lg:block lg:col-span-3 border-l overflow-auto min-h-0">
        {postId
          ? <ChatPostPanel postId={postId} />
          : <div className="p-4 text-sm text-gray-500">Sin publicación vinculada</div>}
      </div>
    </div>
  );
}
