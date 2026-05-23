import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { brandIds } from "@/config/brands";
import { getCurrentUser } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

function getPublicUploadUrl(request: NextRequest, fileName: string) {
  return new URL(`/api/uploads/${fileName}`, request.nextUrl.origin).toString();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const form = await request.formData();
  const brandId = String(form.get("brandId") ?? "");
  const files = form.getAll("files").filter((value): value is File => value instanceof File);

  if (!brandIds.includes(brandId as (typeof brandIds)[number])) {
    return NextResponse.json({ error: "Invalid brand." }, { status: 400 });
  }

  if (files.length === 0 || files.length > 8) {
    return NextResponse.json({ error: "Upload 1 to 8 images." }, { status: 400 });
  }

  const uploaded = [];
  const useSupabaseStorage = hasSupabaseAdminEnv();
  const storage = useSupabaseStorage ? getSupabaseAdmin().storage.from("assets") : null;

  for (const file of files) {
    if (!allowedTypes.has(file.type) || file.size > maxBytes) {
      return NextResponse.json({ error: "Only PNG, JPEG, or WEBP under 10MB are allowed." }, { status: 400 });
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const fileName = `${randomUUID()}.${ext}`;
    const storagePath = `uploads/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (storage) {
      const { error } = await storage.upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
        metadata: {
          uploadedBy: user.sub,
          originalName: file.name,
        },
      });

      if (error) {
        return NextResponse.json({ error: "Image upload failed." }, { status: 500 });
      }
    } else {
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, fileName), buffer);
    }

    uploaded.push({
      name: file.name,
      url: getPublicUploadUrl(request, fileName),
      contentType: file.type,
      size: file.size,
    });
  }

  if (hasSupabaseAdminEnv()) {
    await writeAuditLog({
      actorId: user.sub,
      actorRole: user.role,
      action: "assets.uploaded",
      metadata: { brandId, count: uploaded.length },
    });
  }

  return NextResponse.json({ assets: uploaded });
}
