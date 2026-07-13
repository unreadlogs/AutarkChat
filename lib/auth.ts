import { headers } from "next/headers";
import { connectToDatabase } from "./mongodb";

// In-memory hot cache for active session tokens
export const activeSessionsCache = new Set<string>();

export async function verifyAdminAuth(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // 1. Hot Cache check
  if (activeSessionsCache.has(token)) {
    updateSessionLastActive(token);
    return true;
  }

  // 2. DB fallback check
  try {
    const { db } = await connectToDatabase();
    const session = await db.collection("sessions").findOne({ id: token, isActive: true });
    if (session) {
      activeSessionsCache.add(token);
      updateSessionLastActive(token);
      return true;
    }
  } catch (error) {
    console.error("verifyAdminAuth error checking MongoDB:", error);
  }

  return false;
}

// Background utility to update lastActiveAt
async function updateSessionLastActive(token: string) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("sessions").updateOne(
      { id: token },
      { $set: { lastActiveAt: new Date() } }
    );
  } catch (e) {
    // Ignore updates failures
  }
}
