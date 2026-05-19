import { z } from "zod";
import { brandIds } from "@/config/brands";

export const templateMutationSchema = z.object({
  id: z.string().optional(),
  brandId: z.enum(brandIds),
  name: z.string().min(1).max(160),
  description: z.string().max(500),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isDefault: z.boolean(),
});

export const templateDeleteSchema = z.object({
  id: z.string().min(1),
});
