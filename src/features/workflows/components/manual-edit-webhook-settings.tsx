"use client";

import { Loader2, Save, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CSRF_COOKIE } from "@/lib/auth/session";
import { getCookie } from "@/lib/browser/cookies";
import type { ManualEditWebhookSettings } from "@/features/workflows/schemas";

const initialSettings: ManualEditWebhookSettings = {
  enabled: false,
  url: "",
  method: "POST",
  secret: "",
};

export function ManualEditWebhookSettings() {
  const [settings, setSettings] = useState<ManualEditWebhookSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/workflow-settings/manual-edit-webhook", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load webhook settings.");
        }

        return response.json() as Promise<{ settings: ManualEditWebhookSettings }>;
      })
      .then((json) => {
        if (active) {
          setSettings(json.settings);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Could not load webhook settings.");
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

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/workflow-settings/manual-edit-webhook", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save webhook settings.");
      return;
    }

    toast.success("Manual Edit webhook saved.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Manual Edit n8n webhook
        </CardTitle>
        <CardDescription>
          When a Manual Edit job is submitted, the full brief, brand, template, assets, prompt, AI plan, and logo
          metadata are sent to this webhook.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-[1fr_160px]" onSubmit={saveSettings}>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://n8n.example.com/webhook/..."
              value={settings.url}
              disabled={loading}
              onChange={(event) => setSettings((current) => ({ ...current, url: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Secret header value</Label>
            <Input
              id="webhookSecret"
              placeholder="Optional"
              value={settings.secret}
              disabled={loading}
              onChange={(event) => setSettings((current) => ({ ...current, secret: event.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Sent as `x-manual-edit-secret`.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookMethod">Method</Label>
            <select
              id="webhookMethod"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={settings.method}
              disabled={loading}
              onChange={(event) =>
                setSettings((current) => ({ ...current, method: event.target.value as "POST" | "GET" }))
              }
            >
              <option value="POST">POST JSON</option>
              <option value="GET">GET query</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-md border p-3 text-sm lg:col-span-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              disabled={loading}
              onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
            />
            Enable webhook sending after Manual Edit submit
          </label>

          <div className="lg:col-span-2">
            <Button disabled={loading || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save webhook
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
