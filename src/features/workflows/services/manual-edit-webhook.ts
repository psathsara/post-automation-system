import "server-only";

import type { BrandProfile } from "@/config/brands";
import { getManualEditWebhookSettings } from "@/features/workflows/dev-workflow-settings";
import type { AiPostPlan } from "@/features/generation/services/ai-provider";
import type { ManualEditInput } from "@/features/generation/schemas";
import type { SessionPayload } from "@/lib/auth/session";

type ManualEditWebhookPayload = {
  event: "manual_edit.submitted";
  jobId: string;
  submittedAt: string;
  actor: Pick<SessionPayload, "sub" | "username" | "displayName" | "role">;
  input: ManualEditInput;
  brand: BrandProfile;
  logoPlacement: BrandProfile["logoPlacement"];
  prompt: string;
  aiPlan: AiPostPlan;
  status: string;
};

export async function sendManualEditWebhook(payload: ManualEditWebhookPayload) {
  const settings = getManualEditWebhookSettings();

  if (!settings.enabled || !settings.url) {
    return { sent: false, reason: "Webhook is not configured." };
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (settings.secret) {
    headers["x-manual-edit-secret"] = settings.secret;
  }

  const targetUrl = new URL(settings.url);
  const response =
    settings.method === "GET"
      ? await fetch(withPayloadQuery(targetUrl, payload), {
          method: "GET",
          headers,
          cache: "no-store",
        })
      : await fetch(targetUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          cache: "no-store",
        });

  return {
    sent: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

function withPayloadQuery(url: URL, payload: ManualEditWebhookPayload) {
  url.searchParams.set("event", payload.event);
  url.searchParams.set("jobId", payload.jobId);
  url.searchParams.set("brandId", payload.input.brandId);
  url.searchParams.set("templateId", payload.input.templateId);
  url.searchParams.set("templateName", payload.input.templateName);
  url.searchParams.set("postType", payload.input.postType);
  url.searchParams.set("language", payload.input.language);
  url.searchParams.set("tagline", payload.input.tagline);
  url.searchParams.set("caption", payload.input.caption);
  url.searchParams.set("content", payload.input.content);
  url.searchParams.set("theme", payload.input.theme);
  url.searchParams.set("instructions", payload.input.instructions);
  url.searchParams.set("payload", JSON.stringify(payload));

  return url;
}
