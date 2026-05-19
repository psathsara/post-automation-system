export const roles = ["SUPER_ADMIN", "ADMIN", "USER"] as const;

export type Role = (typeof roles)[number];

export type UserStatus = "ACTIVE" | "DISABLED";

export type AppUser = {
  id: string;
  username: string;
  usernameLower: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type SessionUser = Pick<AppUser, "id" | "username" | "displayName" | "role">;
