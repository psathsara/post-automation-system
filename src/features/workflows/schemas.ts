import { z } from "zod";

export const manualEditWebhookSettingsSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url().or(z.literal("")),
  method: z.enum(["POST", "GET"]),
  secret: z.string().max(256).optional().default(""),
});

export type ManualEditWebhookSettings = z.infer<typeof manualEditWebhookSettingsSchema>;
