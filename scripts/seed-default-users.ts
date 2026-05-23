import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import bcrypt from "bcryptjs";

type SupabaseQuery<T = unknown> = PromiseLike<{ data: T; error: { message: string } | null }> & {
  upsert: (values: unknown, options?: Record<string, unknown>) => SupabaseQuery<T>;
};

type SupabaseClient = {
  from: <T = unknown>(table: string) => SupabaseQuery<T>;
};

type CreateClient = (
  url: string,
  key: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
    };
  },
) => SupabaseClient;

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js") as { createClient: CreateClient };

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadLocalEnv();

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required. Copy .env.example to .env.local and fill Supabase values.`);
  }
}

const users = [
  {
    id: "super-admin-default",
    username: "admin",
    displayName: "Super Admin",
    role: "SUPER_ADMIN",
    password: "Admin123",
  },
  {
    id: "admin-default",
    username: "admin",
    displayName: "Admin",
    role: "ADMIN",
    password: "Admin1234",
  },
  {
    id: "user-default",
    username: "user",
    displayName: "Content User",
    role: "USER",
    password: "User123",
  },
] as const;

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  const now = new Date().toISOString();

  for (const user of users) {
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        username: user.username,
        username_lower: user.username.toLowerCase(),
        display_name: user.displayName,
        role: user.role,
        status: "ACTIVE",
        password_hash: await bcrypt.hash(user.password, 12),
        created_at: now,
        updated_at: now,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw error;
    }

    console.log(`Seeded ${user.role}: ${user.username}`);
  }

  console.log("Default users seeded in Supabase. Rotate passwords before production use.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
