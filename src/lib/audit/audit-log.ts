import "server-only";

import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import type { Role } from "@/types/auth";

type AuditEvent = {
  actorId?: string;
  actorRole?: Role;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
};

export async function writeAuditLog(event: AuditEvent) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const { error } = await getSupabaseAdmin().from("audit_logs").insert({
    actor_id: event.actorId,
    actor_role: event.actorRole,
    action: event.action,
    target: event.target,
    metadata: event.metadata,
    ip: event.ip,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
