import "server-only";

import { createRequire } from "node:module";
import { getServerEnv, hasSupabaseAdminEnv } from "@/lib/env/server";

type SupabaseResult<T = unknown> = PromiseLike<{ data: T; error: { message: string } | null }>;

type SupabaseQuery<T = unknown> = SupabaseResult<T> & {
  select: (columns?: string) => SupabaseQuery<T>;
  eq: (column: string, value: unknown) => SupabaseQuery<T>;
  limit: (count: number) => SupabaseQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQuery<T>;
  single: () => SupabaseQuery<T>;
  delete: () => SupabaseQuery<T>;
  insert: (values: unknown) => SupabaseQuery<T>;
  update: (values: Record<string, unknown>) => SupabaseQuery<T>;
  upsert: (values: unknown, options?: Record<string, unknown>) => SupabaseQuery<T>;
};

type SupabaseAdminClient = {
  from: <T = unknown>(table: string) => SupabaseQuery<T>;
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Buffer,
        options?: {
          contentType?: string;
          upsert?: boolean;
          metadata?: Record<string, string>;
        },
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
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
) => SupabaseAdminClient;

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js") as { createClient: CreateClient };

let cachedClient: SupabaseAdminClient | null = null;

export { hasSupabaseAdminEnv };

export function getSupabaseAdmin() {
  if (!cachedClient) {
    const env = getServerEnv();

    cachedClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedClient;
}
