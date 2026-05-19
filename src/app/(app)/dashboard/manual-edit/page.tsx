import { ManualEditForm } from "@/features/generation/components/manual-edit-form";

export default function ManualEditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Manual Edit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a secure creative brief and preserve exact logo metadata for final production.
        </p>
      </div>
      <ManualEditForm />
    </div>
  );
}
