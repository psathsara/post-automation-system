# Supabase schema

## `public.users`

```ts
{
  id: string;
  username: string;
  username_lower: string;
  display_name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED";
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}
```

## `public.generation_jobs`

```ts
{
  id: string;
  brand_id: string;
  template_id: string;
  template_name: string;
  tagline: string;
  caption: string;
  content: string;
  language: "si" | "en";
  post_type: string;
  theme: string;
  instructions: string;
  assets: UploadedAsset[];
  brand: BrandProfile;
  prompt: string;
  ai_plan: AiPostPlan;
  logo_placement: LogoPlacement;
  status: string;
  workflow_result?: Record<string, unknown>;
  created_by: string;
  created_by_role: string;
  created_at: string;
  updated_at: string;
}
```

## `public.audit_logs`

```ts
{
  id: string;
  actor_id?: string;
  actor_role?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  created_at: string;
}
```
