# Supabase setup

## 1. Create project values

Create a Supabase project, then copy these values into `.env.local` and Vercel Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key private. It must never be exposed in client components.

## 2. Run SQL schema

Open Supabase SQL Editor and run:

```sql
create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  username text not null,
  username_lower text not null,
  display_name text not null,
  role text not null check (role in ('SUPER_ADMIN', 'ADMIN', 'USER')),
  status text not null check (status in ('ACTIVE', 'DISABLED')),
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists users_username_lower_idx on public.users (username_lower);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null,
  template_id text not null,
  template_name text not null,
  tagline text not null,
  caption text not null,
  content text not null,
  language text not null,
  post_type text not null,
  theme text not null,
  instructions text not null default '',
  assets jsonb not null default '[]'::jsonb,
  brand jsonb not null,
  prompt text not null,
  ai_plan jsonb not null,
  logo_placement jsonb not null,
  status text not null,
  workflow_result jsonb,
  created_by text not null,
  created_by_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generation_jobs_created_by_idx on public.generation_jobs (created_by);
create index if not exists generation_jobs_status_idx on public.generation_jobs (status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_role text,
  action text not null,
  target text,
  metadata jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

alter table public.users enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.audit_logs enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

The app uses `SUPABASE_SERVICE_ROLE_KEY` from server-only code, so these tables do not need anon policies for the current UI.
Uploaded images are stored privately in the `assets` bucket under `uploads/{filename}` and served publicly through the app route `/api/uploads/{filename}`. n8n receives full public URLs such as `https://post-automation-system.vercel.app/api/uploads/{filename}`.

## 3. Seed default users

After `.env.local` is filled:

```powershell
npm run seed:supabase
```

Default development credentials:

- SUPER ADMIN: `admin` / `Admin123`
- ADMIN: `admin` / `Admin1234`
- USER: `user` / `User123`

The two admin accounts intentionally share the username because that was requested. For production, move to unique usernames and rotate all default passwords.

## 4. Configure n8n webhook

For Vercel, add this environment variable and redeploy:

```env
N8N_WEBHOOK_URL=https://your-n8n-host/webhook/your-production-path
N8N_WEBHOOK_SECRET=
```

Use the n8n **Production URL** (`/webhook/...`) for normal operation and activate the workflow. The n8n **Test URL** (`/webhook-test/...`) only receives requests while the webhook node is actively listening for a test event.
