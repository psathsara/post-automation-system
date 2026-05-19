import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">System settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Super admin controls for AI, security, and integrations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Security posture</CardTitle>
          <CardDescription>OWASP ASVS L2 foundations are wired into the scaffold.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border p-3">HttpOnly signed sessions</div>
          <div className="rounded-lg border p-3">CSRF double-submit tokens</div>
          <div className="rounded-lg border p-3">RBAC middleware</div>
          <div className="rounded-lg border p-3">Firestore audit logs</div>
        </CardContent>
      </Card>
    </div>
  );
}
