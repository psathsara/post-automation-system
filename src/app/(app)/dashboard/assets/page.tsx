import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploaded images are stored in Supabase Storage through server-side validation.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Storage policy</CardTitle>
          <CardDescription>Brand-scoped upload paths are ready for gallery and approval workflows.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Manual Edit currently uploads directly from the form into brand-specific storage prefixes.
        </CardContent>
      </Card>
    </div>
  );
}
