// src/hooks/useAutoScroll.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-scroll inteligente:
 * - Solo baja al final si el usuario está cerca del fondo (threshold px)
 * - Expone helpers para forzar scroll y saber si está anclado abajo
 */
export function useAutoScroll({ threshold = 120 } = {}) {
  const containerRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= threshold;
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // usar requestAnimationFrame para esperar layout
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setAtBottom(true);
    });
  }, []);

  // Trackea si el usuario se aleja del fondo
  const handleScroll = useCallback(() => {
    setAtBottom(isNearBottom());
  }, [isNearBottom]);

  // Efecto para registrar scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => handleScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    // Estado inicial
    handleScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  /**
   * Llamar cuando llegan mensajes nuevos.
   * Si el usuario está cerca del fondo → auto-bajar.
   * Si no, se respeta su posición y no se auto-scroll.
   */
  const onNewContent = useCallback(() => {
    if (isNearBottom()) scrollToBottom();
  }, [isNearBottom, scrollToBottom]);

  return {
    containerRef,
    atBottom,
    scrollToBottom,
    onNewContent,
  };
}
