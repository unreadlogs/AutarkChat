import { NextResponse } from "next/server";
import { getChatsByUserId, deleteAllChatsByUserId } from "@/lib/queries";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  const result = await getChatsByUserId({
    userId: "admin",
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(result);
}

export async function DELETE() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteAllChatsByUserId("admin");
  return Response.json(result);
}
