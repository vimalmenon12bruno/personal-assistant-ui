import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.HYPERSPACE_API_KEY ?? "no-key",
  baseURL: process.env.HYPERSPACE_BASE_URL ?? "http://localhost:6655/anthropic",
});

export const MODEL = process.env.HYPERSPACE_MODEL ?? "anthropic--claude-4.8-opus";

export const SYSTEM_PROMPT = `You are a highly capable personal assistant with access to web search and tools.

## Core behavior
- When you have enough information to act, act immediately.
- Before reporting progress, verify each claim against information you retrieved this session.
- For minor decisions, pick the best option and note it — do not ask.
- Lead with the outcome. First sentence answers "what happened / what did you find."
- Be concise but clear.`;
