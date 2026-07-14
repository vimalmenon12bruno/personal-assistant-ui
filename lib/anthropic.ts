import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const required = (name: string): string => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
};

export const anthropic = new Anthropic({
  apiKey: required("ANTHROPIC_API_KEY"),
});

export const AGENT_ID = required("AGENT_ID");
export const ENVIRONMENT_ID = required("ENVIRONMENT_ID");
export const MEMORY_STORE_ID = process.env.MEMORY_STORE_ID ?? "";
