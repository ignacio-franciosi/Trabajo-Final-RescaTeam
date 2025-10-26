import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import ChatService from '../services/ChatService';
import { useAuth } from './AuthContext';
import { getUserPublicById } from '../services/UserService';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token } = useAuth();
  const { status, events, sendMessage, sendEvent } = useWebSocketChat(token);

  const [chats, setChats] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [unreadByChat, setUnreadByChat] = useState({});

  // caches/estado interno
  const nameCache = useRef(new Map());     // id -> "Nombre Apellido"
  const inflightFetch = useRef(new Map()); // chatId -> Promise
  const lastFetchAt = useRef({});          // chatId -> timestamp (ms)

  const myId = useMemo(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? String(JSON.parse(savedUser)?.userId ?? '') : '';
    } catch {
      return '';
    }
  }, []);

  async function enrichChatsWithNames(rawChats) {
    if (!Array.isArray(rawChats)) return [];
    const out = [];
    for (const ch of rawChats) {
      const participants = Array.isArray(ch.participants) ? ch.participants : [];
      const otherId =
        participants.find((p) => String(p) !== String(myId)) ??
        participants[0] ?? '';

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
            // fallback: id
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
        setUnreadByChat((prev) => {
          const next = { ...prev };
          for (const ch of enriched) if (next[ch.chatId] == null) next[ch.chatId] = 0;
          return next;
        });
      } catch {
        setChats([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- Helper: fetch de mensajes con de-dupe + throttle + retry 429 ---
  const safeFetchMessages = useCallback(async (chatId) => {
    if (!token || !chatId) return;

    // si ya hay una request en vuelo para este chat, reusar
    const inFlight = inflightFetch.current.get(chatId);
    if (inFlight) return inFlight;

    // throttle: mínimo 1s entre lecturas del mismo chat
    const now = Date.now();
    const last = lastFetchAt.current[chatId] || 0;
    if (now - last < 1000) return;

    const p = ChatService.listMessages(token, chatId)
      .then(({ data }) => {
        setMessagesByChat((prev) => ({ ...prev, [chatId]: data }));
        const count = Array.isArray(data)
          ? data.filter((m) => !m.viewed && String(m.senderId) !== String(myId)).length
          : 0;
        setUnreadByChat((prev) => ({ ...prev, [chatId]: count }));
        lastFetchAt.current[chatId] = Date.now();
      })
      .catch((err) => {
        if (err?.response?.status === 429) {
          setTimeout(() => {
            lastFetchAt.current[chatId] = 0;
            safeFetchMessages(chatId);
          }, 1200);
          return;
        }
      })
      .finally(() => {
        inflightFetch.current.delete(chatId);
      });

    inflightFetch.current.set(chatId, p);
    return p;
  }, [token, myId]);

  // eventos WS -> mensajes/preview/contadores
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
      if (String(msg.senderId) !== String(myId)) {
        setUnreadByChat((prev) => {
          const current = prev[msg.chatId] ?? 0;
          if (msg.chatId === activeChatId && document.visibilityState === 'visible') {
            return { ...prev, [msg.chatId]: 0 };
          }
          return { ...prev, [msg.chatId]: current + 1 };
        });
      }
    }
  }, [events, myId, activeChatId]);

  const getChatById = useCallback(
    (id) => chats.find((c) => c.chatId === id) || null,
    [chats]
  );

  const nameMap = useMemo(
    () => Object.fromEntries(nameCache.current),
    [chats]
  );

  const setActiveChat = useCallback(async (chatId) => {
    setActiveChatId(chatId);
    if (!chatId) return;

    setUnreadByChat((prev) => ({ ...prev, [chatId]: 0 }));
    try { await ChatService.markRead(token, chatId); } catch { /* noop */ }
    await safeFetchMessages(chatId);
  }, [token, safeFetchMessages]);

  // publicar total de no leídos para el Header
  useEffect(() => {
    const total = Object.values(unreadByChat).reduce((a, b) => a + (Number(b) || 0), 0);
    localStorage.setItem('chat_unread_total', String(total));
    window.dispatchEvent(new CustomEvent('chat:unread', { detail: { total } }));
  }, [unreadByChat]);

  const value = useMemo(() => ({
    status,
    chats,
    messagesByChat,
    unreadByChat,
    activeChatId,
    sendMessage,
    sendEvent,
    nameMap,
    getChatById,
    setActiveChat,
    reloadChats: async () => {
      if (!token) return;
      const { data } = await ChatService.listChats(token);
      const enriched = await enrichChatsWithNames(data);
      setChats(enriched);
      setUnreadByChat((prev) => {
        const next = { ...prev };
        for (const ch of enriched) if (next[ch.chatId] == null) next[ch.chatId] = 0;
        return next;
      });
    },
    fetchMessages: safeFetchMessages,
    markRead: async (chatId) => {
      if (!token || !chatId) return;
      try { await ChatService.markRead(token, chatId); } catch { /* noop */ }
      setUnreadByChat((prev) => ({ ...prev, [chatId]: 0 }));
    },
  }), [
    status, chats, messagesByChat, unreadByChat, activeChatId,
    sendMessage, sendEvent, token, nameMap, getChatById, setActiveChat, safeFetchMessages
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
