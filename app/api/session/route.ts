import { NextResponse } from "next/server";

// With Hyperspace, there's no server-side session — we just return a client-generated ID.
// Conversation history is kept in the browser and sent with each request.
export async function POST() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return NextResponse.json({ sessionId });
}
