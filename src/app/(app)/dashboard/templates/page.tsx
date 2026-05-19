import { TemplateManager } from "@/features/templates/components/template-manager";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Template management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand-specific templates, prompt bindings, and final logo placement metadata.
          </p>
        </div>
      </div>
      <TemplateManager />
    </div>
  );
}
