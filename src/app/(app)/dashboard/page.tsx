import { Activity, CheckCircle2, Clock3, LayoutTemplate, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brandProfiles } from "@/config/brands";

const stats = [
  { label: "Generated drafts", value: "128", icon: Sparkles },
  { label: "Active templates", value: "42", icon: LayoutTemplate },
  { label: "Workflow success", value: "98.4%", icon: CheckCircle2 },
  { label: "Pending handoffs", value: "9", icon: Clock3 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge className="bg-accent text-accent-foreground">Production architecture scaffold</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal">Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand-aware AI generation, templates, auditability, and workflow handoff.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Generation pipeline</CardTitle>
            <CardDescription>Manual Edit jobs preserve exact logo metadata for final insertion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Content intake", "AI post plan", "Template render", "n8n handoff", "Canva finalization"].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{step}</span>
                  <Activity className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand system</CardTitle>
            <CardDescription>Separate profiles keep templates and identities isolated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(brandProfiles).map((brand) => (
              <div key={brand.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accentColor }} />
                  <p className="font-medium">{brand.name}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{brand.tone}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
