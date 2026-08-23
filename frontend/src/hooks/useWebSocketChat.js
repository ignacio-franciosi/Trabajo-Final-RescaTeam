import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocketChat(token) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|open|closed
  const [events, setEvents] = useState([]);     // mensajes entrantes {type, payload}

  // guards de reconexión
  const reconnectAttemptRef = useRef(0);
  const connectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!token) return;
    if (connectingRef.current) return; // evita conexiones simultáneas
    connectingRef.current = true;
    setStatus('connecting');

    const WS_BASE = import.meta.env.VITE_CHAT_WS_URL || "ws://localhost:8083";
    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      reconnectAttemptRef.current = 0;       // reset backoff
      connectingRef.current = false;
    };

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
      connectingRef.current = false;
      if (!shouldReconnectRef.current) return;

      // backoff exponencial con tope
      const attempt = Math.min(reconnectAttemptRef.current + 1, 6);
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(15000, 1000 * 2 ** attempt);

      setTimeout(() => {
        // si el hook sigue montado y hay token, reintentar
        if (shouldReconnectRef.current && token) connect();
      }, delay);
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };
  }, [token]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    return () => {
      shouldReconnectRef.current = false;
      try { wsRef.current?.close(); } catch {}
    };
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
