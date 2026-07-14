"use client";

import type { ChatMessage } from "@/lib/types";
import { ToolUseIndicator } from "./ToolUseIndicator";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const activeTools = (message.toolsInUse ?? []).map((t) => t.name);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-sm"
          }`}
        >
          {message.content}
          {/* Streaming cursor */}
          {message.isStreaming && message.role === "assistant" && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
          )}
          {/* Error state */}
          {message.error && (
            <span className="block mt-2 text-red-500 dark:text-red-400 text-xs">
              ⚠ {message.error}
            </span>
          )}
        </div>

        {/* Tool use indicator (below assistant bubble) */}
        {!isUser && activeTools.length > 0 && (
          <ToolUseIndicator names={activeTools} />
        )}

        {/* Tools used (after done) */}
        {!isUser && !message.isStreaming && (message.toolsUsed?.length ?? 0) > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.toolsUsed!.map((t, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              >
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
