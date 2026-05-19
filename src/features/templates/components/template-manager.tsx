"use client";

import { Edit2, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brandProfiles, type BrandId } from "@/config/brands";
import { CSRF_COOKIE } from "@/lib/auth/session";
import { getCookie } from "@/lib/browser/cookies";
import type { BrandTemplate, TemplateStatus } from "@/features/templates/types";

const initialForm = {
  id: "",
  brandId: "jayalath-campus" as BrandId,
  name: "",
  description: "",
  status: "ACTIVE" as TemplateStatus,
  isDefault: false,
};

export function TemplateManager() {
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const brands = useMemo(() => Object.values(brandProfiles), []);
  const isEditing = Boolean(form.id);

  async function loadTemplates() {
    const response = await fetch("/api/templates", { cache: "no-store" });

    if (!response.ok) {
      toast.error("Could not load templates.");
      setLoading(false);
      return;
    }

    const json = (await response.json()) as { templates: BrandTemplate[] };
    setTemplates(json.templates);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/templates", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load templates.");
        }

        return response.json() as Promise<{ templates: BrandTemplate[] }>;
      })
      .then((json) => {
        if (active) {
          setTemplates(json.templates);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Could not load templates.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function editTemplate(template: BrandTemplate) {
    setForm({
      id: template.id,
      brandId: template.brandId,
      name: template.name,
      description: template.description,
      status: template.status,
      isDefault: template.isDefault,
    });
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    const response = await fetch("/api/templates", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify({
        id: form.id || undefined,
        brandId: form.brandId,
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        isDefault: form.isDefault,
      }),
    });

    if (!response.ok) {
      toast.error("Could not save template.");
      return;
    }

    toast.success(isEditing ? "Template updated." : "Template added.");
    resetForm();
    void loadTemplates();
  }

  async function removeTemplate(template: BrandTemplate) {
    const response = await fetch("/api/templates", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify({ id: template.id }),
    });

    if (!response.ok) {
      toast.error("Could not delete template.");
      return;
    }

    toast.success("Template deleted.");
    await loadTemplates();
  }

  async function makeDefault(template: BrandTemplate) {
    const response = await fetch("/api/templates", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify({ ...template, isDefault: true }),
    });

    if (!response.ok) {
      toast.error("Could not set default template.");
      return;
    }

    toast.success(`${template.name} is now the default template.`);
    await loadTemplates();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Update template" : "Add template"}</CardTitle>
          <CardDescription>Choose a brand and mark one template as the default for Manual Edit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveTemplate}>
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <select
                id="brandId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.brandId}
                onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value as BrandId }))}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateName">Template name</Label>
              <Input
                id="templateName"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TemplateStatus }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
              />
              Set as default template
            </label>
            <div className="flex gap-2">
              <Button className="flex-1" type="submit">
                <Plus className="h-4 w-4" />
                {isEditing ? "Save changes" : "Add"}
              </Button>
              {isEditing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card className="md:col-span-2">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading templates...</CardContent>
          </Card>
        ) : null}
        {templates.map((template) => {
          const brand = brandProfiles[template.brandId];

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{brand.name}</CardDescription>
                  </div>
                  {template.isDefault ? <Badge className="bg-accent text-accent-foreground">Default</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">{template.description || brand.tone}</p>
                <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                  <span>Status: {template.status}</span>
                  <span>
                    Size: {template.dimensions.width}x{template.dimensions.height}
                  </span>
                  <span>Logo anchor: {template.logoPlacement.anchor}</span>
                  <span>Safe area: {template.logoPlacement.safeArea}px</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => editTemplate(template)}>
                    <Edit2 className="h-4 w-4" />
                    Update
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={template.isDefault}
                    onClick={() => makeDefault(template)}
                  >
                    <Star className="h-4 w-4" />
                    Default
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => removeTemplate(template)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
