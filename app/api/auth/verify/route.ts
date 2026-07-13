import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
