import { NextResponse } from "next/server";
import { verifyAdminAuth, activeSessionsCache } from "@/lib/auth";
import { getActiveSessions, revokeSession } from "@/lib/queries";

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await getActiveSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing session id" }, { status: 400 });
    }

    // Revoke in DB
    await revokeSession(id);

    // Evict from server hot cache
    activeSessionsCache.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}
