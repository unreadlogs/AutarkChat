import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(request: Request) {
  if (!await verifyAdminAuth()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return Response.json({
      url: `/uploads/${filename}`,
      pathname: file.name,
      contentType: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
