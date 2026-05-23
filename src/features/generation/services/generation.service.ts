import { brandProfiles } from "@/config/brands";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { sanitizeText } from "@/lib/security/sanitize";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
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

  let jobId = `dev-job-${crypto.randomUUID()}`;

  if (hasSupabaseAdminEnv()) {
    const { data, error } = await getSupabaseAdmin()
      .from<{ id: string }>("generation_jobs")
      .insert({
        brand_id: sanitizedInput.brandId,
        template_id: sanitizedInput.templateId,
        template_name: sanitizedInput.templateName,
        tagline: sanitizedInput.tagline,
        caption: sanitizedInput.caption,
        content: sanitizedInput.content,
        language: sanitizedInput.language,
        post_type: sanitizedInput.postType,
        theme: sanitizedInput.theme,
        instructions: sanitizedInput.instructions,
        assets: sanitizedInput.assets,
        brand,
        prompt,
        ai_plan: aiPlan,
        logo_placement: brand.logoPlacement,
        status: doc.status,
        created_by: actor.sub,
        created_by_role: actor.role,
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    jobId = data.id as string;

    await writeAuditLog({
      actorId: actor.sub,
      actorRole: actor.role,
      action: "generation.manual_edit.created",
      target: jobId,
      metadata: { brandId: input.brandId, postType: input.postType },
    });
  }

  const webhook = await sendManualEditWebhook({
    event: "manual_edit.submitted",
    jobId,
    submittedAt: doc.createdAt,
    actor,
    input: sanitizedInput,
    brand,
    logoPlacement: brand.logoPlacement,
    prompt,
    aiPlan,
    status: doc.status,
  });

  return { id: jobId, ...doc, webhook };
}
