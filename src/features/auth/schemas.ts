import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
