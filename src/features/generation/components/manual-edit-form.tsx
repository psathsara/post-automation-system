"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brandProfiles } from "@/config/brands";
import { getDefaultTemplatesByBrand } from "@/features/templates/default-templates";
import type { BrandTemplate } from "@/features/templates/types";
import { getCookie } from "@/lib/browser/cookies";
import { CSRF_COOKIE } from "@/lib/auth/session";
import { manualEditSchema, type ManualEditInput } from "@/features/generation/schemas";

type UploadedAsset = ManualEditInput["assets"][number];

export function ManualEditForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [templatesForBrand, setTemplatesForBrand] = useState<BrandTemplate[]>(
    getDefaultTemplatesByBrand("jayalath-campus"),
  );
  const brands = useMemo(() => Object.values(brandProfiles), []);
  const form = useForm<ManualEditInput>({
    resolver: zodResolver(manualEditSchema),
    defaultValues: {
      brandId: "jayalath-campus",
      templateId: "jayalath-campus-default",
      templateName: "Jayalath Campus Default",
      tagline: "",
      caption: "",
      content: "",
      language: "en",
      postType: "announcement",
      theme: "",
      instructions: "",
      assets: [],
    },
  });
  const selectedBrandId = useWatch({ control: form.control, name: "brandId" });

  useEffect(() => {
    let active = true;

    fetch(`/api/templates?brandId=${selectedBrandId}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load templates.");
        }

        return response.json() as Promise<{ templates: BrandTemplate[] }>;
      })
      .then((json) => {
        if (active) {
          setTemplatesForBrand(json.templates.length > 0 ? json.templates : getDefaultTemplatesByBrand(selectedBrandId));
        }
      })
      .catch(() => {
        if (active) {
          setTemplatesForBrand(getDefaultTemplatesByBrand(selectedBrandId));
        }
      });

    return () => {
      active = false;
    };
  }, [selectedBrandId]);

  useEffect(() => {
    const currentTemplateId = form.getValues("templateId");
    const defaultTemplate = templatesForBrand.find((template) => template.isDefault) ?? templatesForBrand[0];

    if (defaultTemplate && currentTemplateId !== defaultTemplate.id) {
      form.setValue("templateId", defaultTemplate.id);
      form.setValue("templateName", defaultTemplate.name);
    }
  }, [form, templatesForBrand]);

  async function uploadFiles(brandId: string): Promise<UploadedAsset[]> {
    if (files.length === 0) {
      return [];
    }

    const body = new FormData();
    body.set("brandId", brandId);
    files.forEach((file) => body.append("files", file));

    const response = await fetch("/api/assets/upload", {
      method: "POST",
      headers: { "x-csrf-token": getCookie(CSRF_COOKIE) ?? "" },
      body,
    });

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    const json = (await response.json()) as { assets: UploadedAsset[] };
    return json.assets;
  }

  async function onSubmit(values: ManualEditInput) {
    try {
      const selectedTemplate = templatesForBrand.find((template) => template.id === values.templateId);
      const assets = await uploadFiles(values.brandId);
      const response = await fetch("/api/generation/manual-edit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
        },
        body: JSON.stringify({
          ...values,
          templateName: selectedTemplate?.name ?? values.templateName,
          assets,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed.");
      }

      const json = (await response.json()) as {
        job: { id: string; webhook?: { sent: boolean; status?: number; statusText?: string; reason?: string } };
      };
      setResult(json.job.id);
      if (json.job.webhook?.sent) {
        toast.success("Manual Edit job created and sent to n8n.");
      } else {
        toast.warning(
          json.job.webhook?.reason
            ? `Manual Edit job created. Webhook was not sent: ${json.job.webhook.reason}`
            : "Manual Edit job created. Webhook was not sent.",
        );
      }
      form.reset(values);
      setFiles([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create job.");
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Creative brief</CardTitle>
          <CardDescription>AI creates the post plan; logos are reserved for Canva/n8n final insertion.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandId">Brand</Label>
            <select
              id="brandId"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("brandId")}
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postType">Post type</Label>
            <select
              id="postType"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("postType")}
            >
              <option value="announcement">Announcement</option>
              <option value="offer">Offer</option>
              <option value="event">Event</option>
              <option value="testimonial">Testimonial</option>
              <option value="education">Education</option>
              <option value="recruitment">Recruitment</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="templateId">Template</Label>
            <select
              id="templateId"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("templateId", {
                onChange: (event) => {
                  const selectedTemplate = templatesForBrand.find(
                    (template) => template.id === event.target.value,
                  );
                  form.setValue("templateName", selectedTemplate?.name ?? "");
                },
              })}
            >
              {templatesForBrand.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.isDefault ? " - Default" : ""}
                </option>
              ))}
            </select>
            {templatesForBrand.length === 0 ? (
              <p className="text-sm text-destructive">Add a template for this brand before generating.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("language")}
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Input id="theme" placeholder="Example: premium intake announcement" {...form.register("theme")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...form.register("tagline")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" {...form.register("caption")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="content">Sinhala or English content</Label>
            <Textarea id="content" className="min-h-36" {...form.register("content")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="instructions">Additional design instructions</Label>
            <Textarea id="instructions" {...form.register("instructions")} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>PNG, JPEG, or WEBP. Max 8 files, 10MB each.</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 p-6 text-center">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <span className="mt-3 text-sm font-medium">Select images</span>
              <span className="mt-1 text-xs text-muted-foreground">{files.length} selected</span>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 8))}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit</CardTitle>
            <CardDescription>Creates an auditable generation job with logo placement metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate AI plan
            </Button>
            {result ? <p className="text-sm text-muted-foreground">Created job: {result}</p> : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
