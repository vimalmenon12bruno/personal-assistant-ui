import { NextResponse } from "next/server";

// File downloads are not available with the direct Messages API.
export async function GET() {
  return NextResponse.json({ files: [] });
}
