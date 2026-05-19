import type { BrandId, LogoPlacement } from "@/config/brands";

export type TemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type BrandTemplate = {
  id: string;
  brandId: BrandId;
  name: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
  status: TemplateStatus;
  isDefault: boolean;
  logoPlacement: LogoPlacement;
  createdAt: string;
  updatedAt: string;
};
