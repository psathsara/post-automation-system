import { NextResponse } from "next/server";
import {
  createDevUser,
  deleteDevUser,
  listDevUsers,
  updateDevUser,
} from "@/features/auth/dev-users";
import { userCreateSchema, userDeleteSchema, userUpdateSchema } from "@/features/users/schemas";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import type { Role, UserStatus } from "@/types/auth";

type SupabaseUserRow = {
  id: string;
  username: string;
  username_lower: string;
  display_name: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

type ManagedUser = {
  id: string;
  username: string;
  usernameLower: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string;
};

function mapUser(row: SupabaseUserRow): ManagedUser {
  return {
    id: row.id,
    username: row.username,
    usernameLower: row.username_lower,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at ?? undefined,
  };
}

async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!can(user.role, "manageUsers")) {
    return { error: NextResponse.json({ error: "Permission denied." }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  if (!hasSupabaseAdminEnv()) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ users: listDevUsers() });
    }

    return NextResponse.json({ error: "User storage is not configured." }, { status: 503 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from<SupabaseUserRow[]>("users")
    .select("id, username, username_lower, display_name, role, status, created_at, updated_at, last_login_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }

  return NextResponse.json({ users: (data ?? []).map(mapUser) });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    if (process.env.NODE_ENV !== "production") {
      const user = createDevUser(parsed.data);

      return NextResponse.json({ user }, { status: 201 });
    }

    return NextResponse.json({ error: "User storage is not configured." }, { status: 503 });
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { data, error } = await getSupabaseAdmin()
    .from<SupabaseUserRow>("users")
    .insert({
      id,
      username: parsed.data.username,
      username_lower: parsed.data.username.toLowerCase(),
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      status: parsed.data.status,
      password_hash: await hashPassword(parsed.data.password),
      created_at: now,
      updated_at: now,
    })
    .select("id, username, username_lower, display_name, role, status, created_at, updated_at, last_login_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not create user." }, { status: 500 });
  }

  return NextResponse.json({ user: mapUser(data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...input } = parsed.data;

  if (!hasSupabaseAdminEnv()) {
    if (process.env.NODE_ENV !== "production") {
      const user = updateDevUser(id, input);

      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: "User storage is not configured." }, { status: 503 });
  }

  const update: Record<string, unknown> = {
    username: input.username,
    username_lower: input.username.toLowerCase(),
    display_name: input.displayName,
    role: input.role,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.password?.trim()) {
    update.password_hash = await hashPassword(input.password);
  }

  const { data, error } = await getSupabaseAdmin()
    .from<SupabaseUserRow>("users")
    .update(update)
    .eq("id", id)
    .select("id, username, username_lower, display_name, role, status, created_at, updated_at, last_login_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user: mapUser(data) });
}

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = userDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid delete payload." }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    if (process.env.NODE_ENV !== "production") {
      const deleted = deleteDevUser(parsed.data.id);

      if (!deleted) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "User storage is not configured." }, { status: 503 });
  }

  const { error } = await getSupabaseAdmin().from("users").delete().eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
