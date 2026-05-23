import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function isAllowedFileName(fileName: string) {
  return /^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i.test(fileName);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await context.params;

  if (!isAllowedFileName(fileName)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = contentTypes[ext] ?? "application/octet-stream";

  if (hasSupabaseAdminEnv()) {
    const { data, error } = await getSupabaseAdmin().storage.from("assets").download(`uploads/${fileName}`);

    if (error || !data) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return new Response(data, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": contentType,
      },
    });
  }

  try {
    const buffer = await readFile(join(process.cwd(), "public", "uploads", fileName));

    return new Response(buffer, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
