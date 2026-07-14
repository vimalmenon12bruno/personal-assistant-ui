import { anthropic, MODEL, SYSTEM_PROMPT } from "@/lib/anthropic";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const runtime = "nodejs";
export const maxDuration = 300;

function encode(event: string, data: object): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  );
}

export async function POST(req: Request) {
  let message: string;
  let history: MessageParam[];

  try {
    ({ message, history = [] } = await req.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Build messages array: history + new user message
  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ];

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    try {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });

      let fullText = "";

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const text = event.delta.text;
          fullText += text;
          await writer.write(encode("text", { text }));
        }

        if (event.type === "message_stop") {
          // Send the complete assistant message back so the browser can
          // append it to history for the next turn
          await writer.write(encode("done", { assistantText: fullText }));
          break;
        }

        if (
          event.type === "message_delta" &&
          event.delta.stop_reason === "max_tokens"
        ) {
          await writer.write(encode("done", { assistantText: fullText }));
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
