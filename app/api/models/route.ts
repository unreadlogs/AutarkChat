import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { getCustomModels, addCustomModel, deleteCustomModel } from "@/lib/queries";
import { z } from "zod";

const addModelSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(50).optional().default("openai"),
  baseUrl: z.string().nullable().optional(),
  apiKey: z.string().optional().default(""),
  modelId: z.string().min(1),
});

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const models = await getCustomModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error("GET /api/models error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = addModelSchema.parse(json);

    const newModel = await addCustomModel({
      name: body.name,
      provider: body.provider,
      baseUrl: body.baseUrl ?? null,
      apiKey: body.apiKey,
      modelId: body.modelId,
    });

    return NextResponse.json({ success: true, model: newModel });
  } catch (error) {
    console.error("POST /api/models error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid model configuration data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add model" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await deleteCustomModel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/models error:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
