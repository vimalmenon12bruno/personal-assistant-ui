"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, AgentFile } from "@/lib/types";

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<AgentFile[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const appendText = useCallback((text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + text },
      ];
    });
  }, []);

  const addTool = useCallback((id: string, name: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      const existing = last.toolsInUse ?? [];
      if (existing.some((t) => t.id === id)) return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, toolsInUse: [...existing, { id, name }] },
      ];
    });
  }, []);

  const removeTool = useCallback((name: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      const remaining = (last.toolsInUse ?? []).filter((t) => t.name !== name);
      const used = [...(last.toolsUsed ?? []), name];
      return [
        ...prev.slice(0, -1),
        { ...last, toolsInUse: remaining, toolsUsed: used },
      ];
    });
  }, []);

  const finalizeMessage = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, isStreaming: false, toolsInUse: [] },
      ];
    });
    setIsStreaming(false);
  }, []);

  const setMessageError = useCallback((errorMsg: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, isStreaming: false, toolsInUse: [], error: errorMsg },
      ];
    });
    setIsStreaming(false);
  }, []);

  const checkFiles = useCallback(
    async (sid: string) => {
      // Wait for indexing lag then fetch
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/files?sessionId=${sid}`);
        if (!res.ok) return;
        const { files } = await res.json();
        if (files.length > 0) {
          setPendingFiles(files);
          return;
        }
        // Retry once more after another 2s
        await new Promise((r) => setTimeout(r, 2000));
        const res2 = await fetch(`/api/files?sessionId=${sid}`);
        if (!res2.ok) return;
        const { files: files2 } = await res2.json();
        if (files2.length > 0) setPendingFiles(files2);
      } catch {
        // Silently ignore file-listing errors
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || isStreaming || !text.trim()) return;

      // Clear any previous pending files
      setPendingFiles([]);

      // Append user + empty assistant messages
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

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                switch (currentEvent) {
                  case "text":
                    appendText(data.text ?? "");
                    break;
                  case "tool_use":
                    addTool(data.id, data.name);
                    break;
                  case "tool_result":
                    removeTool(data.name);
                    break;
                  case "done":
                    finalizeMessage();
                    checkFiles(sessionId);
                    break;
                  case "error":
                    setMessageError(data.message ?? "Unknown error");
                    break;
                }
              } catch {
                // Skip malformed SSE data lines
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          finalizeMessage();
        } else {
          setMessageError(
            err instanceof Error ? err.message : "Connection failed"
          );
        }
      }
    },
    [sessionId, isStreaming, appendText, addTool, removeTool, finalizeMessage, setMessageError, checkFiles]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingFiles([]);
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
