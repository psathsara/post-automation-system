import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const secret = request.headers.get("x-n8n-secret");

  if (!env.N8N_WEBHOOK_SECRET || secret !== env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("generation_jobs")
    .update({
      status: body.status ?? "WORKFLOW_UPDATED",
      workflow_result: body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    return NextResponse.json({ error: "Could not update workflow job." }, { status: 500 });
  }

  await writeAuditLog({
    action: "workflow.n8n.manual_edit.updated",
    target: jobId,
    metadata: { status: body.status },
  });

  return NextResponse.json({ ok: true });
}
