import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { manualEditSchema } from "@/features/generation/schemas";
import { createManualEditJob } from "@/features/generation/services/generation.service";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const limited = rateLimit(`generation:${user.sub}`, 20, 60_000);

  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many generation requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = manualEditSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid generation payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const job = await createManualEditJob(parsed.data, user);

  return NextResponse.json({ job }, { status: 201 });
}
