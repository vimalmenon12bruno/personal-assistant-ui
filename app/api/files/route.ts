import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const fileId = searchParams.get("fileId");
  const filename = searchParams.get("filename") ?? "download";

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Download a specific file
  if (fileId) {
    try {
      const content = await anthropic.beta.files.download(fileId);
      const buffer = Buffer.from(await content.arrayBuffer());
      return new Response(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/octet-stream",
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Download failed" },
        { status: 500 }
      );
    }
  }

  // List files for this session
  try {
    const files = await anthropic.beta.files.list({
      // @ts-expect-error scope_id is valid but may not be in type defs yet
      scope_id: sessionId,
      betas: ["managed-agents-2026-04-01"],
    });
    return NextResponse.json({ files: files.data ?? [] });
  } catch (err) {
    // Not an error if no files exist — return empty
    console.error("[/api/files list]", err);
    return NextResponse.json({ files: [] });
  }
}
