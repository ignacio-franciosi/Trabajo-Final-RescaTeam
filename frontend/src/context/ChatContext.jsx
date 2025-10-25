import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import ChatService from '../services/ChatService';
import { useAuth } from './AuthContext';
import { getUserPublicById } from '../services/UserService';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token } = useAuth();
  const { status, events, sendMessage, sendEvent } = useWebSocketChat(token);

  const [chats, setChats] = useState([]);                   // [{chatId, participants, postId, ... , displayName}]
  const [messagesByChat, setMessagesByChat] = useState({}); // { chatId: [msgs...] }

  // cache nombres para /user/public/:id
  const nameCache = React.useRef(new Map()); // id -> "Nombre Apellido"

  async function enrichChatsWithNames(rawChats) {
    if (!Array.isArray(rawChats)) return [];

    let myId = '';
    try {
      const savedUser = localStorage.getItem('user');
      myId = savedUser ? String(JSON.parse(savedUser)?.userId ?? '') : '';
    } catch {}

    const out = [];
    for (const ch of rawChats) {
      const participants = Array.isArray(ch.participants) ? ch.participants : [];
      const otherId =
        participants.find((p) => String(p) !== String(myId)) ??
        participants[0] ??
        '';

      let displayName = otherId || 'Chat';

      if (otherId) {
        if (nameCache.current.has(otherId)) {
          displayName = nameCache.current.get(otherId);
        } else {
          try {
            const pub = await getUserPublicById(otherId); // { id_user, name, surname }
            const full = [pub?.name, pub?.surname].filter(Boolean).join(' ').trim();
            if (full) {
              displayName = full;
              nameCache.current.set(otherId, full);
            }
          } catch {
            // fallback al id si falla
          }
        }
      }

      out.push({ ...ch, otherId, displayName });
    }
    return out;
  }

  // cargar lista de chats
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await ChatService.listChats(token);
        const enriched = await enrichChatsWithNames(data);
        setChats(enriched);
      } catch {
        setChats([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // eventos WS -> mensajes/preview
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
            ? { ...c, lastMessage: msg.content, lastUpdate: msg.timestamp }
            : c
        )
      );
    }
  }, [events]);

  // función pedida por ChatPage
  const getChatById = useCallback(
    (id) => chats.find((c) => c.chatId === id) || null,
    [chats]
  );

  // exponer un nameMap (opcional)
  const nameMap = useMemo(
    () => Object.fromEntries(nameCache.current),
    [chats] // recalcula cuando cambian los chats; suficiente para UI
  );

  const value = useMemo(() => ({
    status,
    chats,
    messagesByChat,
    sendMessage,
    sendEvent,
    nameMap,
    getChatById,
    reloadChats: async () => {
      if (!token) return;
      const { data } = await ChatService.listChats(token);
      const enriched = await enrichChatsWithNames(data);
      setChats(enriched);
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
  }), [status, chats, messagesByChat, sendMessage, sendEvent, token, nameMap, getChatById]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
