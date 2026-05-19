import { brandProfiles, type BrandId } from "@/config/brands";
import type { BrandTemplate } from "@/features/templates/types";

const DEFAULT_CREATED_AT = "2026-01-01T00:00:00.000Z";

export function createDefaultTemplates(): BrandTemplate[] {
  return Object.values(brandProfiles).map((brand) => ({
    id: `${brand.id}-default`,
    brandId: brand.id,
    name: `${brand.name} Default`,
    description: `Default 1080x1080 layout for ${brand.name}.`,
    dimensions: { width: 1080, height: 1080 },
    status: "ACTIVE",
    isDefault: true,
    logoPlacement: brand.logoPlacement,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  }));
}

export function getDefaultTemplatesByBrand(brandId: BrandId) {
  return createDefaultTemplates().filter((template) => template.brandId === brandId);
}
