import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { getPersonalization, updatePersonalization } from "@/lib/queries";
import { z } from "zod";

const personalizationSchema = z.object({
  preferredName: z.string().max(100).default(""),
  occupation: z.string().max(150).default(""),
  aboutMe: z.string().max(1000).default(""),
  customInstructions: z.string().max(5000).default(""),
});

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getPersonalization();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("GET /api/settings/personalization error:", error);
    return NextResponse.json({ error: "Failed to fetch personalization settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = personalizationSchema.parse(json);

    await updatePersonalization({
      preferredName: body.preferredName,
      occupation: body.occupation,
      aboutMe: body.aboutMe,
      customInstructions: body.customInstructions,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/settings/personalization error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid personalization data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save personalization settings" }, { status: 500 });
  }
}
