import { brandIds, brandProfiles, type BrandId } from "@/config/brands";
import { createDefaultTemplates } from "@/features/templates/default-templates";
import type { BrandTemplate } from "@/features/templates/types";

const templates: BrandTemplate[] = createDefaultTemplates();

export function listTemplates(brandId?: BrandId) {
  return templates
    .filter((template) => !brandId || template.brandId === brandId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
}

export function createTemplate(
  input: Pick<BrandTemplate, "brandId" | "name" | "description" | "status" | "isDefault">,
) {
  const now = new Date().toISOString();
  const template: BrandTemplate = {
    id: crypto.randomUUID(),
    brandId: input.brandId,
    name: input.name,
    description: input.description,
    dimensions: { width: 1080, height: 1080 },
    status: input.status,
    isDefault: input.isDefault,
    logoPlacement: brandProfiles[input.brandId].logoPlacement,
    createdAt: now,
    updatedAt: now,
  };

  templates.push(template);

  if (template.isDefault) {
    setDefaultTemplate(template.id);
  }

  return template;
}

export function updateTemplate(
  id: string,
  input: Pick<BrandTemplate, "brandId" | "name" | "description" | "status" | "isDefault">,
) {
  const index = templates.findIndex((template) => template.id === id);

  if (index === -1) {
    return null;
  }

  const current = templates[index]!;
  const updated: BrandTemplate = {
    ...current,
    ...input,
    logoPlacement: brandProfiles[input.brandId].logoPlacement,
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;

  if (updated.isDefault) {
    setDefaultTemplate(updated.id);
  }

  return templates.find((template) => template.id === id) ?? null;
}

export function setDefaultTemplate(id: string) {
  const selected = templates.find((template) => template.id === id);

  if (!selected) {
    return null;
  }

  for (const template of templates) {
    if (template.brandId === selected.brandId) {
      template.isDefault = template.id === id;
      template.updatedAt = new Date().toISOString();
      if (template.id === id) {
        template.status = "ACTIVE";
      }
    }
  }

  return selected;
}

export function deleteTemplate(id: string) {
  const index = templates.findIndex((template) => template.id === id);

  if (index === -1) {
    return false;
  }

  const [removed] = templates.splice(index, 1);

  if (removed?.isDefault) {
    const next = templates.find((template) => template.brandId === removed.brandId);

    if (next) {
      setDefaultTemplate(next.id);
    }
  }

  return true;
}

export function isBrandId(value: string): value is BrandId {
  return brandIds.includes(value as BrandId);
}
