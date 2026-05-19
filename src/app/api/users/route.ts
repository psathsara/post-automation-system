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

  return NextResponse.json({ users: listDevUsers() });
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

  const user = createDevUser(parsed.data);

  return NextResponse.json({ user }, { status: 201 });
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
  const user = updateDevUser(id, input);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
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

  const deleted = deleteDevUser(parsed.data.id);

  if (!deleted) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
