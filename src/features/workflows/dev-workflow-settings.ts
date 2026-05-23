import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ManualEditWebhookSettings } from "@/features/workflows/schemas";

const settingsPath = join(process.cwd(), ".data", "manual-edit-webhook.json");

const defaultSettings: ManualEditWebhookSettings = {
  enabled: false,
  url: "",
  method: "POST",
  secret: "",
};

let manualEditWebhookSettings: ManualEditWebhookSettings = loadSettings();

export function getManualEditWebhookSettings() {
  return manualEditWebhookSettings;
}

export function updateManualEditWebhookSettings(settings: ManualEditWebhookSettings) {
  manualEditWebhookSettings = settings;
  saveSettings(settings);
  return manualEditWebhookSettings;
}

function loadSettings(): ManualEditWebhookSettings {
  try {
    if (!existsSync(settingsPath)) {
      return defaultSettings;
    }

    return { ...defaultSettings, ...(JSON.parse(readFileSync(settingsPath, "utf8")) as ManualEditWebhookSettings) };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: ManualEditWebhookSettings) {
  try {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch {
    // Vercel serverless filesystems are not durable/writable for app settings.
    // Keep the in-memory value for the warm instance and prefer env vars in production.
  }
}
