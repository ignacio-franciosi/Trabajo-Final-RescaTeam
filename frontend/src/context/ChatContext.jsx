import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { ChatService } from '../services/ChatService'
import { AuthContext } from './AuthContext';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token } = useContext(AuthContext);
  const { status, events, sendMessage } = useWebSocketChat(token);

  const [chats, setChats] = useState([]);           // [{chatId, ...}]
  const [messagesByChat, setMessagesByChat] = useState({}); // { chatId: [msgs...] }

  // cargar lista de chats al montar
  useEffect(() => {
    if (!token) return;
    ChatService.listChats(token).then(({ data }) => setChats(data));
  }, [token]);

  // manejar eventos entrantes WS
  useEffect(() => {
    if (!events.length) return;
    const evt = events[events.length - 1];

    if (evt.type === 'message' || evt.type === 'message:sent') {
      const msg = evt.payload;
      setMessagesByChat((prev) => {
        const list = prev[msg.chatId] || [];
        return { ...prev, [msg.chatId]: [...list, msg] };
      });
      // opcional: actualizar preview de chat
      setChats((prev) =>
        prev.map((c) => (c.chatId === msg.chatId ? { ...c, lastMessage: msg.content, lastUpdate: msg.timestamp } : c))
      );
    }
  }, [events]);

  const value = useMemo(() => ({
    status,
    chats,
    messagesByChat,
    sendMessage,
    reloadChats: async () => {
      if (!token) return;
      const { data } = await ChatService.listChats(token);
      setChats(data);
    },
    fetchMessages: async (chatId) => {
      if (!token) return;
      const { data } = await ChatService.listMessages(token, chatId);
      setMessagesByChat((prev) => ({ ...prev, [chatId]: data }));
    },
    markRead: async (chatId) => {
      if (!token) return;
      await ChatService.markRead(token, chatId);
    },
  }), [status, chats, messagesByChat, sendMessage, token]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
