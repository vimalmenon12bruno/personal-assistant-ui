export type MessageRole = "user" | "assistant";

export interface ToolUse {
  id: string;
  name: string;
}

export interface AgentFile {
  id: string;
  filename: string;
  size_bytes: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  toolsInUse?: ToolUse[];
  toolsUsed?: string[];
  error?: string;
}

// Browser-side SSE event shapes from /api/chat
export type SseEventType = "text" | "tool_use" | "tool_result" | "done" | "error";

export interface SseTextEvent {
  type: "text";
  text: string;
}
export interface SseToolUseEvent {
  type: "tool_use";
  name: string;
  id: string;
}
export interface SseToolResultEvent {
  type: "tool_result";
  name: string;
}
export interface SseDoneEvent {
  type: "done";
}
export interface SseErrorEvent {
  type: "error";
  message: string;
}

export type SseEvent =
  | SseTextEvent
  | SseToolUseEvent
  | SseToolResultEvent
  | SseDoneEvent
  | SseErrorEvent;
