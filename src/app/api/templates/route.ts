import { NextResponse, type NextRequest } from "next/server";
import {
  createTemplate,
  deleteTemplate,
  isBrandId,
  listTemplates,
  updateTemplate,
} from "@/features/templates/dev-templates";
import { templateDeleteSchema, templateMutationSchema } from "@/features/templates/schemas";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";

async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  return { user };
}

async function requireTemplateManager() {
  const auth = await requireUser();

  if ("error" in auth) {
    return auth;
  }

  if (!can(auth.user.role, "manageTemplates")) {
    return { error: NextResponse.json({ error: "Permission denied." }, { status: 403 }) };
  }

  return auth;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser();

  if ("error" in auth) {
    return auth.error;
  }

  const brandId = request.nextUrl.searchParams.get("brandId");

  if (brandId && !isBrandId(brandId)) {
    return NextResponse.json({ error: "Invalid brand." }, { status: 400 });
  }

  const selectedBrandId = brandId && isBrandId(brandId) ? brandId : undefined;

  return NextResponse.json({ templates: listTemplates(selectedBrandId) });
}

export async function POST(request: Request) {
  const auth = await requireTemplateManager();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = templateMutationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const template = createTemplate(parsed.data);

  return NextResponse.json({ template }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireTemplateManager();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = templateMutationSchema.extend({ id: templateDeleteSchema.shape.id }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...input } = parsed.data;
  const template = updateTemplate(id, input);

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function DELETE(request: Request) {
  const auth = await requireTemplateManager();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = templateDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid delete payload." }, { status: 400 });
  }

  const deleted = deleteTemplate(parsed.data.id);

  if (!deleted) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
