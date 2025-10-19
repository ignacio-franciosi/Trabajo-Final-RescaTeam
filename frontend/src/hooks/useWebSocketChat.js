import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocketChat(token) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|open|closed
  const [events, setEvents] = useState([]);     // cola simple de mensajes entrantes

  const connect = useCallback(() => {
    if (!token) return;
    setStatus('connecting');

    //const url = `ws://${location.hostname}:8083/ws`;
    //const ws = new WebSocket(url, []); // protocolo vacío
    const WS_BASE = import.meta.env.VITE_CHAT_WS_URL || "ws://localhost:8083";
     const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      // Adjunto token en primer frame (si tu backend lo tomara así).
      // Nosotros ya autenticamos por header en Gin, así que esto no es necesario.
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [...prev, data]); // {type, payload}
      } catch {}
    };

    ws.onclose = () => {
      setStatus('closed');
      // reconectar lineal/exponencial
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const sendMessage = useCallback(({ chatId, receiverId, postId, content }) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const message = {
      chatId, receiverId, postId, content,
    };
    wsRef.current.send(JSON.stringify(message));
  }, []);

  return { status, events, sendMessage };
}
