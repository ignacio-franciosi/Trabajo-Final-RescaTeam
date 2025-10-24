import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import ChatService from '../services/ChatService';
import { useAuth } from './AuthContext';
import { fetchUserName } from '../services/UsersLookup';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token, user } = useAuth();
  const myId = String(user?.userId ?? '');
  const { status, events, sendMessage } = useWebSocketChat(token);

  const [chats, setChats] = useState([]);                    // [{chatId, ...}]
  const [messagesByChat, setMessagesByChat] = useState({});  // { chatId: [msgs...] }
  const [nameMap, setNameMap] = useState({});                // { userId: "Nombre Apellido" }

  // cargar lista de chats
  useEffect(() => {
    if (!token) return;
    ChatService.listChats(token)
      .then(({ data }) => setChats(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  // poblar nombre del "otro" en cada chat (cache)
  useEffect(() => {
    if (!Array.isArray(chats) || !myId) return;
    const missing = new Set();
    for (const ch of chats) {
      for (const p of ch?.participants || []) {
        const pid = String(p);
        if (pid !== myId && !nameMap[pid]) {
          missing.add(pid);
        }
      }
    }
    if (missing.size === 0) return;

    (async () => {
      const updates = {};
      for (const uid of missing) {
        const { fullName } = await fetchUserName(uid);
        updates[uid] = fullName;
      }
      setNameMap((prev) => ({ ...prev, ...updates }));
    })();
  }, [chats, myId]); // nameMap se actualiza adentro; no lo ponemos aquí para evitar loops

  // manejar eventos WS
  useEffect(() => {
    if (!events.length) return;
    const evt = events[events.length - 1];

    if (evt.type === 'message' || evt.type === 'message:sent') {
      const msg = evt.payload;
      setMessagesByChat((prev) => {
        const list = prev[msg.chatId] || [];
        return { ...prev, [msg.chatId]: [...list, msg] };
      });
      setChats((prev) =>
        prev.map((c) =>
          c.chatId === msg.chatId
            ? { ...c, lastMessage: msg.content, lastUpdate: msg.timestamp, lastSenderId: msg.senderId }
            : c
        )
      );
    }
  }, [events]);

  const value = useMemo(() => ({
    status,
    chats,
    messagesByChat,
    nameMap,           // <- NUEVO, para el listado
    sendMessage,
    reloadChats: async () => {
      if (!token) return;
      const { data } = await ChatService.listChats(token);
      setChats(Array.isArray(data) ? data : []);
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
    getChatById: (id) => chats.find((c) => c.chatId === id) || null,
  }), [status, chats, messagesByChat, nameMap, sendMessage, token]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
