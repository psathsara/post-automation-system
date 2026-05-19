import { z } from "zod";
import { brandIds } from "@/config/brands";

export const assetSchema = z.object({
  name: z.string().min(1).max(180),
  path: z.string().min(1).max(500),
  url: z.string().max(1000).optional(),
  contentType: z.string().min(1).max(80),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});

export const manualEditSchema = z.object({
  brandId: z.enum(brandIds),
  templateId: z.string().min(1).max(120),
  templateName: z.string().min(1).max(160),
  tagline: z.string().min(1).max(180),
  caption: z.string().min(1).max(2000),
  content: z.string().min(1).max(4000),
  language: z.enum(["si", "en"]),
  postType: z.enum(["announcement", "offer", "event", "testimonial", "education", "recruitment"]),
  theme: z.string().min(1).max(120),
  instructions: z.string().max(2000),
  assets: z.array(assetSchema).max(8),
});

export type ManualEditInput = z.infer<typeof manualEditSchema>;
