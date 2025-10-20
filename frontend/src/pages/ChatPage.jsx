// ChatPage.jsx
import { useContext, useEffect, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const { chats, fetchMessages } = useContext(ChatContext);
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(paramChatId || null);

  useEffect(() => { if (paramChatId) setActiveId(paramChatId); }, [paramChatId]);
  useEffect(() => { if (activeId) fetchMessages(activeId); }, [activeId, fetchMessages]);

  return (
    <div className="grid grid-cols-12 h-[calc(100vh-64px)]">
      <div className="col-span-3 border-r">
        <ChatList
          chats={chats}
          selectedChatId={activeId}     
          onSelect={setActiveId}
          currentUserId={String(user?.userId ?? '')} 
        />
      </div>
      <div className="col-span-9">
        {activeId
          ? <ChatWindow chatId={activeId} />
          : <div className="p-6 text-gray-500">Selecciona un chat</div>}
      </div>
    </div>
  );
}
