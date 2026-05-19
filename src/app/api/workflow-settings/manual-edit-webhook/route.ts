import { NextResponse } from "next/server";
import {
  getManualEditWebhookSettings,
  updateManualEditWebhookSettings,
} from "@/features/workflows/dev-workflow-settings";
import { manualEditWebhookSettingsSchema } from "@/features/workflows/schemas";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";

async function requireWorkflowManager() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!can(user.role, "manageWorkflows")) {
    return { error: NextResponse.json({ error: "Permission denied." }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireWorkflowManager();

  if ("error" in auth) {
    return auth.error;
  }

  return NextResponse.json({ settings: getManualEditWebhookSettings() });
}

export async function PUT(request: Request) {
  const auth = await requireWorkflowManager();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = manualEditWebhookSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook settings.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const settings = updateManualEditWebhookSettings(parsed.data);

  return NextResponse.json({ settings });
}
