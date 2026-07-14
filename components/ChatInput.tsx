"use client";

import { useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming || disabled) return;
    el.value = "";
    el.style.height = "auto";
    onSend(text);
  };

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={isStreaming ? "Assistant is responding…" : "Message your assistant…"}
            disabled={disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 px-4 py-3 pr-12 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            style={{ minHeight: "48px" }}
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex-shrink-0 h-11 w-11 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors touch-manipulation"
            aria-label="Stop"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled}
            className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Send"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="13" x2="8" y2="3" />
              <polyline points="3 8 8 3 13 8" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
        Enter to send &nbsp;·&nbsp; Shift+Enter for new line
      </p>
    </div>
  );
}
