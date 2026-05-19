import { brandProfiles } from "@/config/brands";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasFirebaseAdminEnv } from "@/lib/env/server";
import { sanitizeText } from "@/lib/security/sanitize";
import type { SessionPayload } from "@/lib/auth/session";
import type { ManualEditInput } from "@/features/generation/schemas";
import { getAiProvider } from "@/features/generation/services/ai-provider";
import { sendManualEditWebhook } from "@/features/workflows/services/manual-edit-webhook";

export async function createManualEditJob(input: ManualEditInput, actor: SessionPayload) {
  const brand = brandProfiles[input.brandId];
  const sanitizedInput = {
    ...input,
    tagline: sanitizeText(input.tagline, 180),
    caption: sanitizeText(input.caption, 2000),
    content: sanitizeText(input.content, 4000),
    theme: sanitizeText(input.theme, 120),
    instructions: sanitizeText(input.instructions ?? "", 2000),
  };

  const prompt = [
    `Brand: ${brand.name}`,
    `Template: ${sanitizedInput.templateName} (${sanitizedInput.templateId})`,
    `Brand tone: ${brand.tone}`,
    `Brand colors: ${brand.primaryColor}, ${brand.accentColor}`,
    `Post type: ${sanitizedInput.postType}`,
    `Theme: ${sanitizedInput.theme}`,
    `Language: ${sanitizedInput.language}`,
    `Tagline: ${sanitizedInput.tagline}`,
    `Caption: ${sanitizedInput.caption}`,
    `Content: ${sanitizedInput.content}`,
    `Additional instructions: ${sanitizedInput.instructions}`,
    "Important: never recreate, redraw, alter, hallucinate, or place logos.",
    `Reserve this exact final logo metadata only: ${JSON.stringify(brand.logoPlacement)}.`,
  ].join("\n");

  const aiPlan = await getAiProvider().createPostPlan(prompt);

  const doc = {
    ...sanitizedInput,
    brand,
    prompt,
    aiPlan,
    logoPlacement: brand.logoPlacement,
    status: "AI_PLAN_CREATED",
    createdBy: actor.sub,
    createdByRole: actor.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = hasFirebaseAdminEnv()
    ? await getAdminDb().collection("generationJobs").add(doc)
    : { id: `dev-job-${crypto.randomUUID()}` };

  if (hasFirebaseAdminEnv()) {
    await writeAuditLog({
      actorId: actor.sub,
      actorRole: actor.role,
      action: "generation.manual_edit.created",
      target: ref.id,
      metadata: { brandId: input.brandId, postType: input.postType },
    });
  }

  const webhook = await sendManualEditWebhook({
    event: "manual_edit.submitted",
    jobId: ref.id,
    submittedAt: doc.createdAt,
    actor,
    input: sanitizedInput,
    brand,
    logoPlacement: brand.logoPlacement,
    prompt,
    aiPlan,
    status: doc.status,
  });

  return { id: ref.id, ...doc, webhook };
}
