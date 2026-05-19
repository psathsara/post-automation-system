import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
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
  await getAdminDb().collection("auditLogs").add({
    ...event,
    createdAt: new Date().toISOString(),
  });
}
