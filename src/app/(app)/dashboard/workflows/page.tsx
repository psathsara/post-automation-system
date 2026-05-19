import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualEditWebhookSettings } from "@/features/workflows/components/manual-edit-webhook-settings";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Workflows</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          n8n and Canva integration surfaces are isolated behind server-side adapters.
        </p>
      </div>

      <ManualEditWebhookSettings />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incoming n8n callback</CardTitle>
            <CardDescription>POST /api/workflows/n8n/manual-edit with x-n8n-secret.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use this endpoint to update generation jobs after external Canva or rendering workflows complete.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Canva handoff</CardTitle>
            <CardDescription>Prepared for OAuth credentials and template payload export.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The AI plan stores a Canva-ready payload while logo insertion remains a final deterministic step.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
