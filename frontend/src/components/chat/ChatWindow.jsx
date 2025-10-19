import { useContext, useMemo, useRef } from 'react';
import { ChatContext } from '../../context/ChatContext';
import ChatBubble from './ChatBubble';
import ChatMessageInput from './ChatMessageInput';
import { AuthContext } from '../../context/AuthContext';

export default function ChatWindow({ chatId }) {
  const { messagesByChat, sendMessage, markRead } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const msgs = messagesByChat[chatId] || [];
  const listRef = useRef(null);

  // auto-scroll
  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 0);
  useMemo(scrollToEnd, [msgs.length]);

  // marcar leído al montar/actualizar
  useMemo(() => { markRead(chatId).catch(() => {}); }, [chatId, msgs.length]);

  const handleSend = (text) => {
    sendMessage({ chatId, content: text });
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-2">
        {msgs.map((m) => (
          <ChatBubble key={m.messageId} mine={m.senderId === String(user?.id_user)} msg={m} />
        ))}
      </div>
      <div className="border-t p-3">
        <ChatMessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
