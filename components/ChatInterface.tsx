"use client";

import { useSession } from "@/hooks/useSession";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { FileDownloadList } from "./FileDownloadList";

export function ChatInterface() {
  const { sessionId, loading: sessionLoading, error: sessionError, resetSession } = useSession();
  const { messages, isStreaming, pendingFiles, sendMessage, cancelStream, clearMessages } = useChat(sessionId);

  const handleNewChat = () => {
    clearMessages();
    resetSession();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400 text-xl">✦</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Personal Assistant</span>
          {sessionId && (
            <span className="hidden sm:block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
              {sessionId.slice(0, 16)}…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sessionLoading && (
            <span className="text-xs text-gray-400 animate-pulse">Connecting…</span>
          )}
          <button
            onClick={handleNewChat}
            disabled={isStreaming}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 touch-manipulation"
            title="Start a new chat session"
          >
            New chat
          </button>
        </div>
      </header>

      {/* Session error */}
      {sessionError && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex-shrink-0">
          <strong>Connection error:</strong> {sessionError}
          <button
            onClick={resetSession}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} />

      {/* File downloads */}
      {pendingFiles.length > 0 && sessionId && (
        <FileDownloadList files={pendingFiles} sessionId={sessionId} />
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isStreaming={isStreaming}
        disabled={!sessionId || sessionLoading || !!sessionError}
      />
    </div>
  );
}
