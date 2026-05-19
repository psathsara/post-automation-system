import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { brandIds } from "@/config/brands";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasFirebaseAdminEnv } from "@/lib/env/server";
import { getAdminStorageBucket } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-log";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

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
  const useFirebaseStorage = hasFirebaseAdminEnv();
  const bucket = useFirebaseStorage ? getAdminStorageBucket() : null;

  for (const file of files) {
    if (!allowedTypes.has(file.type) || file.size > maxBytes) {
      return NextResponse.json({ error: "Only PNG, JPEG, or WEBP under 10MB are allowed." }, { status: 400 });
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const fileName = `${randomUUID()}.${ext}`;
    const path = useFirebaseStorage
      ? `brands/${brandId}/uploads/${fileName}`
      : `/uploads/manual-edit/${brandId}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (useFirebaseStorage && bucket) {
      await bucket.file(path).save(buffer, {
        contentType: file.type,
        metadata: {
          metadata: {
            uploadedBy: user.sub,
            originalName: file.name,
          },
        },
      });
    } else {
      const uploadDir = join(process.cwd(), "public", "uploads", "manual-edit", brandId);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, fileName), buffer);
    }

    uploaded.push({
      name: file.name,
      path,
      url: useFirebaseStorage ? undefined : path,
      contentType: file.type,
      size: file.size,
    });
  }

  if (hasFirebaseAdminEnv()) {
    await writeAuditLog({
      actorId: user.sub,
      actorRole: user.role,
      action: "assets.uploaded",
      metadata: { brandId, count: uploaded.length },
    });
  }

  return NextResponse.json({ assets: uploaded });
}
