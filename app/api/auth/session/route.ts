import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET() {
  const isAuth = await verifyAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ authorized: false }, { status: 401 });
  }
  return NextResponse.json({ authorized: true });
}
