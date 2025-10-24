// src/pages/ChatPage.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import ChatPostPanel from '../components/chat/ChatPostPanel';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const { chats, fetchMessages, nameMap, getChatById } = useContext(ChatContext);
  const { user } = useAuth();

  const [activeId, setActiveId] = useState(paramChatId || null);

  useEffect(() => { if (paramChatId) setActiveId(paramChatId); }, [paramChatId]);
  useEffect(() => { if (activeId) fetchMessages(activeId); }, [activeId, fetchMessages]);

  const activeChat = useMemo(() => (activeId ? getChatById(activeId) : null), [activeId, getChatById]);
  const postId = activeChat?.postId || null;

  return (
    <div className="grid grid-cols-12 h-[calc(100vh-64px)]">
      {/* Columna izquierda: lista */}
      <div className="col-span-3 border-r">
        <ChatList
          chats={chats}
          selectedChatId={activeId}
          onSelect={setActiveId}
          currentUserId={String(user?.userId ?? '')}
          nameMap={nameMap}
        />
      </div>

      {/* Columna central: ventana de chat */}
      <div className="col-span-6">
        {activeId
          ? <ChatWindow chatId={activeId} />
          : <div className="p-6 text-gray-500">Selecciona un chat</div>}
      </div>

      {/* Columna derecha: card del post */}
      <div className="col-span-3 border-l">
        {postId ? <ChatPostPanel postId={postId} /> : <div className="p-4 text-sm text-gray-500">Sin publicación vinculada</div>}
      </div>
    </div>
  );
}
