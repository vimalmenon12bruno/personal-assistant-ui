import { anthropic } from "@/lib/anthropic";

// Use nodejs runtime so the full Anthropic SDK is available (not edge-restricted)
export const runtime = "nodejs";
export const maxDuration = 300;

function encode(event: string, data: object): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  );
}

export async function POST(req: Request) {
  let sessionId: string;
  let message: string;

  try {
    ({ sessionId, message } = await req.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  // Drive the stream asynchronously — response returns immediately
  (async () => {
    try {
      // Stream-first: open SDK stream BEFORE sending the user message
      // so we don't miss early events
      const sdkStream = anthropic.beta.sessions.events.stream(sessionId, {
        event_deltas: ["agent.message"],
      } as Parameters<typeof anthropic.beta.sessions.events.stream>[1]);

      // Send user message after stream is open
      await anthropic.beta.sessions.events.send(sessionId, {
        events: [
          {
            type: "user.message",
            content: [{ type: "text", text: message }],
          },
        ],
      });

      // Accumulate streaming text per message event id
      const streamingText: Record<string, string> = {};

      for await (const event of sdkStream) {
        const t = event.type as string;

        // Live text deltas (opted-in via event_deltas)
        if (t === "event_delta") {
          const ev = event as {
            event_id: string;
            delta?: { type?: string; content?: { type?: string; text?: string } };
          };
          if (ev.delta?.type === "content_delta" && ev.delta.content?.type === "text") {
            const text = ev.delta.content.text ?? "";
            streamingText[ev.event_id] = (streamingText[ev.event_id] ?? "") + text;
            await writer.write(encode("text", { text }));
          }
          continue;
        }

        // Fallback: full agent message (when live deltas aren't available)
        if (t === "agent.message") {
          const ev = event as {
            id: string;
            content: Array<{ type: string; text?: string }>;
          };
          // Only emit if we haven't already streamed this message live
          if (!streamingText[ev.id]) {
            for (const block of ev.content) {
              if (block.type === "text" && block.text) {
                await writer.write(encode("text", { text: block.text }));
              }
            }
          }
          continue;
        }

        if (t === "agent.tool_use" || t === "agent.mcp_tool_use") {
          const ev = event as { id: string; name: string };
          await writer.write(encode("tool_use", { name: ev.name, id: ev.id }));
          continue;
        }

        if (t === "agent.tool_result" || t === "agent.mcp_tool_result") {
          const ev = event as { name?: string };
          await writer.write(encode("tool_result", { name: ev.name ?? "" }));
          continue;
        }

        if (t === "session.status_idle") {
          const ev = event as { stop_reason?: { type?: string } };
          const stopType = ev.stop_reason?.type ?? "end_turn";
          if (stopType !== "requires_action") {
            await writer.write(encode("done", {}));
            break;
          }
          // requires_action — keep streaming (waiting on custom tool)
          continue;
        }

        if (t === "session.status_terminated") {
          await writer.write(encode("done", {}));
          break;
        }

        if (t === "session.error") {
          const ev = event as { error?: { message?: string } };
          await writer.write(
            encode("error", { message: ev.error?.message ?? "Session error" })
          );
          break;
        }
      }
    } catch (err) {
      console.error("[/api/chat stream]", err);
      try {
        await writer.write(
          encode("error", {
            message: err instanceof Error ? err.message : "Stream error",
          })
        );
      } catch {
        // writer already closed
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
