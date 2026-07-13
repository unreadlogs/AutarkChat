import { NextResponse } from "next/server";
import { createSession } from "@/lib/queries";
import { activeSessionsCache } from "@/lib/auth";
import { generateUUID } from "@/lib/utils";

function parseUserAgent(uaString: string | null) {
  if (!uaString) return { browser: "Unknown Browser", os: "Unknown OS" };
  
  let os = "Unknown OS";
  if (uaString.includes("Windows")) os = "Windows";
  else if (uaString.includes("Macintosh") || uaString.includes("Mac OS X")) os = "macOS";
  else if (uaString.includes("Linux")) os = "Linux";
  else if (uaString.includes("Android")) os = "Android";
  else if (uaString.includes("iPhone") || uaString.includes("iPad")) os = "iOS";

  let browser = "Unknown Browser";
  if (uaString.includes("Firefox/")) browser = "Firefox";
  else if (uaString.includes("Chrome/") && !uaString.includes("Chromium/") && !uaString.includes("Edg/")) browser = "Chrome";
  else if (uaString.includes("Safari/") && !uaString.includes("Chrome/")) browser = "Safari";
  else if (uaString.includes("Edg/")) browser = "Edge";
  else if (uaString.includes("Opera/") || uaString.includes("OPR/")) browser = "Opera";

  return { browser, os };
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Extract User-Agent and Client IP
    const userAgent = request.headers.get("user-agent");
    const { browser, os } = parseUserAgent(userAgent);

    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = xForwardedFor ? xForwardedFor.split(",")[0].trim() : "127.0.0.1";

    const sessionId = generateUUID();
    const friendlyName = `${browser} on ${os}`;

    // Create session in DB
    await createSession({
      id: sessionId,
      name: friendlyName,
      browser,
      os,
      ipAddress,
    });

    // Cache in server memory
    activeSessionsCache.add(sessionId);

    return NextResponse.json({
      success: true,
      secret: sessionId, // This is returned to client to store as 'admin_secret'
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
