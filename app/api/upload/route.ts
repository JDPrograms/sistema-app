import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = formData.get("slug") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeSlug = slug ? slug.replace(/[^a-z0-9-_]/gi, "") : "";
    const dir = safeSlug
      ? join(process.cwd(), "public", "uploads", safeSlug)
      : join(process.cwd(), "public", "uploads");

    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Formato de imagen no permitido" }, { status: 400 });
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(dir, filename);

    await writeFile(filepath, buffer);

    const url = safeSlug ? `/uploads/${safeSlug}/${filename}` : `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error al subir imagen" }, { status: 500 });
  }
}
