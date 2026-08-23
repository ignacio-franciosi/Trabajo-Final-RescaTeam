import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";

/*
 * Caja de texto + botón enviar.
 * Props:
 * - onSend: (text: string) => Promise<void> | void
 * - disabled?: boolean
 * - placeholder?: string
*/

function ChatMessageInput({
  onSend,
  disabled = false,
  placeholder = "Escribe un mensaje…",
}, ref) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      try {
        textareaRef.current?.focus();
      } catch (e) {
        /* noop */
      }
    },
  }));

  const handleSend = async () => {
    const text = value.trim();
    if (!text || !onSend || disabled || sending) return;
    try {
      setSending(true);
      await onSend(text);
      setValue("");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-sm"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || sending || !value.trim()}
          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50"
          title="Enviar"
        >
          Enviar
        </button>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        Enter para enviar – Shift+Enter para nueva línea
      </p>
    </div>
  );
}

export default forwardRef(ChatMessageInput);
