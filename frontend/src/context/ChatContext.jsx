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

  // Ref to track pending chat reloads
  const pendingReloadRef = useRef(false);
  const reloadTimeoutRef = useRef(null);

  const myId = useMemo(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? String(JSON.parse(savedUser)?.userId ?? '') : '';
    } catch {
      return '';
    }
  }, []);

  const enrichChatsWithNames = useCallback(async (rawChats) => {
    if (!Array.isArray(rawChats)) return [];
    const out = [];
    for (const ch of rawChats) {
      const participants = Array.isArray(ch.participants) ? ch.participants.map(p => String(p)) : [];
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
  }, [myId]);

  // Function to reload chats from server
  const reloadChats = useCallback(async () => {
    if (!token || pendingReloadRef.current) return;
    pendingReloadRef.current = true;

    try {
      const { data } = await ChatService.listChats(token);
      const enriched = await enrichChatsWithNames(data);
      setChats(enriched);
      setUnreadByChat((prev) => {
        const next = { ...prev };
        for (const ch of enriched) if (next[ch.chatId] == null) next[ch.chatId] = 0;
        return next;
      });
    } catch (err) {
      console.error('Error reloading chats:', err);
    } finally {
      pendingReloadRef.current = false;
    }
  }, [token, enrichChatsWithNames]);

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
  }, [token, enrichChatsWithNames]);

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

      // Update chats AND check if chat exists
      setChats((prev) => {
        const existing = prev.find((c) => c.chatId === msg.chatId);
        const others = prev.filter((c) => c.chatId !== msg.chatId);

        if (!existing) {
          // New chat detected - schedule a reload
          if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
          reloadTimeoutRef.current = setTimeout(() => {
            reloadChats();
          }, 50);

          // Return unchanged for now - reload will add it
          return prev;
        } else {
          // Update existing chat
          const updated = { ...existing, lastMessage: msg.content, lastUpdate: msg.timestamp };
          const merged = [updated, ...others];
          merged.sort((a, b) => {
            const ta = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
            const tb = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
            return tb - ta;
          });
          return merged;
        }
      });

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

    // Evento: otro usuario marcó mensajes como vistos
    if (evt.type === 'messages:viewed') {
      const { chatId, viewedBy } = evt.payload || {};
      if (!chatId) return;
      // Si otro usuario (no yo) vio los mensajes, marcar como viewed los mensajes que yo envié
      if (String(viewedBy) === String(myId)) return; // si yo fui quien marcó como leído, no hace falta actualizar
      setMessagesByChat((prev) => {
        const list = Array.isArray(prev[chatId]) ? prev[chatId] : [];
        const updated = list.map((m) => {
          try {
            if (String(m.senderId) === String(myId)) {
              return { ...m, viewed: true };
            }
          } catch {
            // noop
          }
          return m;
        });
        return { ...prev, [chatId]: updated };
      });
    }
  }, [events, myId, activeChatId, reloadChats]);

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
    reloadChats,
    fetchMessages: safeFetchMessages,
    markRead: async (chatId) => {
      if (!token || !chatId) return;
      try { await ChatService.markRead(token, chatId); } catch { /* noop */ }
      setUnreadByChat((prev) => ({ ...prev, [chatId]: 0 }));
    },
  }), [
    status, chats, messagesByChat, unreadByChat, activeChatId,
    sendMessage, sendEvent, token, nameMap, getChatById, setActiveChat, safeFetchMessages, reloadChats
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
