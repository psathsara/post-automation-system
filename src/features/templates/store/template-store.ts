"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { brandProfiles, type BrandId } from "@/config/brands";
import type { BrandTemplate, TemplateStatus } from "@/features/templates/types";

type TemplateInput = {
  id?: string;
  brandId: BrandId;
  name: string;
  description: string;
  status: TemplateStatus;
  isDefault: boolean;
};

type TemplateStore = {
  templates: BrandTemplate[];
  upsertTemplate: (input: TemplateInput) => void;
  deleteTemplate: (id: string) => void;
  setDefaultTemplate: (id: string) => void;
  getTemplatesByBrand: (brandId: BrandId) => BrandTemplate[];
  getDefaultTemplate: (brandId: BrandId) => BrandTemplate | undefined;
};

function createDefaultTemplates(): BrandTemplate[] {
  const now = new Date().toISOString();

  return Object.values(brandProfiles).map((brand) => ({
    id: `${brand.id}-default`,
    brandId: brand.id,
    name: `${brand.name} Default`,
    description: `Default 1080x1080 layout for ${brand.name}.`,
    dimensions: { width: 1080, height: 1080 },
    status: "ACTIVE",
    isDefault: true,
    logoPlacement: brand.logoPlacement,
    createdAt: now,
    updatedAt: now,
  }));
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: createDefaultTemplates(),
      upsertTemplate: (input) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = input.id
            ? state.templates.find((template) => template.id === input.id)
            : undefined;
          const nextTemplate: BrandTemplate = {
            id: existing?.id ?? crypto.randomUUID(),
            brandId: input.brandId,
            name: input.name,
            description: input.description,
            dimensions: existing?.dimensions ?? { width: 1080, height: 1080 },
            status: input.status,
            isDefault: input.isDefault,
            logoPlacement: brandProfiles[input.brandId].logoPlacement,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          const withoutCurrent = state.templates.filter((template) => template.id !== nextTemplate.id);
          const templates = [...withoutCurrent, nextTemplate].map((template) =>
            nextTemplate.isDefault && template.brandId === nextTemplate.brandId
              ? { ...template, isDefault: template.id === nextTemplate.id }
              : template,
          );

          return { templates };
        }),
      deleteTemplate: (id) =>
        set((state) => {
          const removed = state.templates.find((template) => template.id === id);

          if (!removed) {
            return state;
          }

          const templates = state.templates.filter((template) => template.id !== id);
          const brandTemplates = templates.filter((template) => template.brandId === removed.brandId);

          if (removed.isDefault && brandTemplates.length > 0) {
            const [first, ...rest] = brandTemplates;
            return {
              templates: templates.map((template) =>
                template.id === first.id
                  ? { ...template, isDefault: true, status: "ACTIVE" }
                  : rest.some((item) => item.id === template.id)
                    ? { ...template, isDefault: false }
                    : template,
              ),
            };
          }

          return { templates };
        }),
      setDefaultTemplate: (id) =>
        set((state) => {
          const selected = state.templates.find((template) => template.id === id);

          if (!selected) {
            return state;
          }

          return {
            templates: state.templates.map((template) =>
              template.brandId === selected.brandId
                ? { ...template, isDefault: template.id === id, status: template.id === id ? "ACTIVE" : template.status }
                : template,
            ),
          };
        }),
      getTemplatesByBrand: (brandId) =>
        get()
          .templates.filter((template) => template.brandId === brandId)
          .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name)),
      getDefaultTemplate: (brandId) =>
        get().templates.find((template) => template.brandId === brandId && template.isDefault) ??
        get().templates.find((template) => template.brandId === brandId),
    }),
    {
      name: "jayalath-template-store",
      version: 1,
      skipHydration: true,
    },
  ),
);

export function useTemplateStoreHydrated() {
  const [hydrated, setHydrated] = useState(useTemplateStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useTemplateStore.persist.onFinishHydration(() => setHydrated(true));

    if (!useTemplateStore.persist.hasHydrated()) {
      void useTemplateStore.persist.rehydrate();
    }

    return unsubscribe;
  }, []);

  return hydrated;
}
