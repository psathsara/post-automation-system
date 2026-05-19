import type { AppUser } from "@/types/auth";

export type DevUser = Omit<AppUser, "passwordHash" | "createdAt" | "updatedAt"> & {
  password: string;
};

const devUsers: DevUser[] = [
  {
    id: "dev-super-admin",
    username: "admin",
    usernameLower: "admin",
    displayName: "Super Admin",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    password: "Admin123",
  },
  {
    id: "dev-admin",
    username: "admin",
    usernameLower: "admin",
    displayName: "Admin",
    role: "ADMIN",
    status: "ACTIVE",
    password: "Admin1234",
  },
  {
    id: "dev-user",
    username: "user",
    usernameLower: "user",
    displayName: "Content User",
    role: "USER",
    status: "ACTIVE",
    password: "User123",
  },
];

export type ManagedDevUser = Omit<DevUser, "password">;

export function listDevUsers(): ManagedDevUser[] {
  return devUsers.map((user) => ({
    id: user.id,
    username: user.username,
    usernameLower: user.usernameLower,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  }));
}

export function createDevUser(input: Omit<DevUser, "id" | "usernameLower">) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development users are not available in production.");
  }

  const user: DevUser = {
    ...input,
    id: crypto.randomUUID(),
    usernameLower: input.username.toLowerCase(),
  };

  devUsers.push(user);
  return listDevUsers().find((item) => item.id === user.id)!;
}

export function updateDevUser(
  id: string,
  input: Partial<Omit<DevUser, "id" | "usernameLower">>,
) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development users are not available in production.");
  }

  const index = devUsers.findIndex((user) => user.id === id);

  if (index === -1) {
    return null;
  }

  const current = devUsers[index]!;
  const updated: DevUser = {
    ...current,
    ...input,
    usernameLower: input.username ? input.username.toLowerCase() : current.usernameLower,
    password: input.password?.trim() ? input.password : current.password,
  };

  devUsers[index] = updated;
  return listDevUsers().find((user) => user.id === id) ?? null;
}

export function deleteDevUser(id: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development users are not available in production.");
  }

  const index = devUsers.findIndex((user) => user.id === id);

  if (index === -1) {
    return false;
  }

  devUsers.splice(index, 1);
  return true;
}

export function findDevUser(username: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    devUsers.find(
      (user) => user.usernameLower === username.toLowerCase() && user.password === password,
    ) ?? null
  );
}
