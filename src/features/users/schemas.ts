import { z } from "zod";
import { roles } from "@/types/auth";

export const userCreateSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/),
  displayName: z.string().min(2).max(120),
  role: z.enum(roles),
  status: z.enum(["ACTIVE", "DISABLED"]),
  password: z.string().min(6).max(128),
});

export const userUpdateSchema = userCreateSchema
  .extend({
    id: z.string().min(1),
    password: z.string().max(128).optional(),
  })
  .refine((value) => !value.password || value.password.length >= 6, {
    path: ["password"],
    message: "Password must be at least 6 characters.",
  });

export const userDeleteSchema = z.object({
  id: z.string().min(1),
});
