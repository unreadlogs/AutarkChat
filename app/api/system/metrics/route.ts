import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getCustomModels } from "@/lib/queries";

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get chat and message counts
    const chatsCol = db.collection("chats");
    const totalChats = await chatsCol.countDocuments();

    const totalMessages = await db.collection("messages").countDocuments();

    const customModels = await getCustomModels();

    return NextResponse.json({
      databaseStatus: "Connected",
      totalChats,
      totalMessages,
      totalModels: customModels.length,
      nodeVersion: process.version,
      platform: process.platform,
    });
  } catch (error) {
    console.error("GET /api/system/metrics error:", error);
    return NextResponse.json({
      databaseStatus: "Disconnected",
      totalChats: 0,
      totalMessages: 0,
      totalModels: 0,
      nodeVersion: process.version,
      platform: process.platform,
    });
  }
}
