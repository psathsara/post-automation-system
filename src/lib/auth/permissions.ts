import type { Role } from "@/types/auth";

export const permissions = {
  dashboard: ["SUPER_ADMIN", "ADMIN", "USER"],
  generatePosts: ["SUPER_ADMIN", "ADMIN", "USER"],
  manageTemplates: ["SUPER_ADMIN", "ADMIN"],
  managePrompts: ["SUPER_ADMIN", "ADMIN"],
  manageWorkflows: ["SUPER_ADMIN", "ADMIN"],
  viewAnalytics: ["SUPER_ADMIN", "ADMIN"],
  manageUsers: ["SUPER_ADMIN"],
  manageSystem: ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissions;

export function can(role: Role, permission: Permission) {
  return (permissions[permission] as readonly Role[]).includes(role);
}
