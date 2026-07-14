import { NextResponse } from "next/server";
import { anthropic, AGENT_ID, ENVIRONMENT_ID, MEMORY_STORE_ID } from "@/lib/anthropic";

export async function POST() {
  try {
    const resources = [];

    if (MEMORY_STORE_ID) {
      resources.push({
        type: "memory_store" as const,
        memory_store_id: MEMORY_STORE_ID,
        access: "read_write" as const,
        instructions:
          "Your persistent memory across all sessions. Check this at the start of every task. Write user preferences, important facts, and task outcomes here.",
      });
    }

    const session = await anthropic.beta.sessions.create({
      agent: { type: "agent", id: AGENT_ID },
      environment_id: ENVIRONMENT_ID,
      title: `Session ${new Date().toISOString()}`,
      ...(resources.length > 0 ? { resources } : {}),
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("[/api/session]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
