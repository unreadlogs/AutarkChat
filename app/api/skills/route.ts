import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { getSkills, createOrUpdateSkill, toggleSkillState, deleteSkill } from "@/lib/skills";

export async function GET() {
  try {
    const list = await getSkills();
    return NextResponse.json({ skills: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load skills" }, { status: 550 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, description, files, manual } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required fields." }, { status: 400 });
    }

    let resolvedFiles: Array<{ name: string; content: string }> = [];
    if (Array.isArray(files)) {
      resolvedFiles = files;
    } else if (typeof manual === "string") {
      resolvedFiles = [{ name: "SKILL.md", content: manual }];
    } else {
      return NextResponse.json({ error: "Either files array or manual text must be provided." }, { status: 400 });
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const skill = await createOrUpdateSkill(cleanId, name, description || "", resolvedFiles);
    return NextResponse.json({ success: true, skill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create skill" }, { status: 550 });
  }
}

export async function PATCH(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isEnabled } = await request.json();
    if (!id || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "id and isEnabled are required fields." }, { status: 400 });
    }
    const skill = await toggleSkillState(id, isEnabled);
    if (!skill) {
      return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, skill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to toggle skill state" }, { status: 550 });
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
      return NextResponse.json({ error: "id is a required parameter." }, { status: 400 });
    }
    const deleted = await deleteSkill(id);
    if (!deleted) {
      return NextResponse.json({ error: "Skill not found or could not be deleted." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete skill" }, { status: 550 });
  }
}
