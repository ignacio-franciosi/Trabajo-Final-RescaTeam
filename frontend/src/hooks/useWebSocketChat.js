import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocketChat(token) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|open|closed
  const [events, setEvents] = useState([]);     // mensajes entrantes {type, payload}

  const connect = useCallback(() => {
    if (!token) return;
    setStatus('connecting');

    const WS_BASE = import.meta.env.VITE_CHAT_WS_URL || "ws://localhost:8083";
    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus('open');

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Esperamos objetos del tipo { type: string, payload: any }
        setEvents((prev) => [...prev, data]);
      } catch {
        // Ignorar frames que no sean JSON
      }
    };

    ws.onclose = () => {
      setStatus('closed');
      // reconectar
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  // Enviar "eventos" al WS con el wrapper que espera el backend
  const sendEvent = useCallback((type, payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    const frame = { type, payload };
    ws.send(JSON.stringify(frame));
  }, []);

  // Enviar un mensaje de chat
  const sendMessage = useCallback(({ chatId, receiverId, postId, content }) => {
    // el backend espera:
    // { type: "send_message", payload: { chatId, receiverId, postId, content } }
    sendEvent('send_message', { chatId, receiverId, postId, content });
  }, [sendEvent]);

  return { status, events, sendMessage, sendEvent };
}
