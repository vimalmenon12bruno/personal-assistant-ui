"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, AgentFile } from "@/lib/types";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingFiles] = useState<AgentFile[]>([]);
  const historyRef = useRef<HistoryMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const appendText = useCallback((text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + text }];
    });
  }, []);

  const finalizeMessage = useCallback((assistantText: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, isStreaming: false, toolsInUse: [] }];
    });
    setIsStreaming(false);
    // Append to history for next turn
    historyRef.current.push({ role: "assistant", content: assistantText });
  }, []);

  const setMessageError = useCallback((errorMsg: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, isStreaming: false, toolsInUse: [], error: errorMsg }];
    });
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || isStreaming || !text.trim()) return;

      // Append user message to display and history
      const userMsg: ChatMessage = { id: nextId(), role: "user", content: text };
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: "",
        isStreaming: true,
        toolsInUse: [],
        toolsUsed: [],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      historyRef.current.push({ role: "user", content: text });

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            // Send full history minus the just-added user message
            // (the API route appends the new user message itself)
            history: historyRef.current.slice(0, -1),
          }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                switch (currentEvent) {
                  case "text":
                    fullText += data.text ?? "";
                    appendText(data.text ?? "");
                    break;
                  case "done":
                    finalizeMessage(data.assistantText ?? fullText);
                    break;
                  case "error":
                    setMessageError(data.message ?? "Unknown error");
                    break;
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          finalizeMessage("");
        } else {
          // Remove the user message we added to history since the request failed
          historyRef.current.pop();
          setMessageError(err instanceof Error ? err.message : "Connection failed");
        }
      }
    },
    [sessionId, isStreaming, appendText, finalizeMessage, setMessageError]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  return {
    messages,
    isStreaming,
    pendingFiles,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}
