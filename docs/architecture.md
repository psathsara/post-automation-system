# Architecture

## Folder structure

- `src/app` - Next.js App Router pages, layouts, and route handlers.
- `src/components` - reusable app shell and ShadCN-style UI primitives.
- `src/config` - static brand profiles and logo placement metadata.
- `src/features` - feature-owned schemas, components, and services.
- `src/lib/auth` - password hashing, signed sessions, RBAC, and current-user helpers.
- `src/lib/supabase` - server-only Supabase service-role client.
- `src/lib/security` - CSRF, rate limiting, and sanitization utilities.
- `src/lib/audit` - append-only audit log writer.
- `docs` - setup and architecture documentation.

## Auth and RBAC

Authentication is credentials-based. Passwords are hashed with bcrypt and verified server-side. Sessions are signed JWTs stored in `HttpOnly`, `SameSite=Lax`, `__Host-` cookies.

RBAC is enforced in `src/proxy.ts`, the Next.js 16 request proxy convention, before protected dashboard and API routes execute. API handlers still re-read the current user for defense in depth.

## Manual Edit workflow

1. User submits brand, content, theme, instructions, and optional images.
2. Images are uploaded through `/api/assets/upload`; the server validates type/size before writing to Supabase Storage.
3. `/api/generation/manual-edit` validates the creative brief with Zod.
4. The AI provider creates a structured post plan.
5. The job is stored in Supabase Postgres with exact brand logo placement metadata.
6. n8n/Canva can update the job through `/api/workflows/n8n/manual-edit`.

The AI prompt explicitly forbids logo generation. Logo placement metadata is deterministic and stored outside the generated visual plan.

## Security baseline

- Zod validation at API boundaries.
- Signed, HttpOnly session cookies.
- CSRF double-submit header checks for mutating API requests.
- RBAC middleware for protected routes.
- Supabase service role only on the server.
- Supabase Row Level Security for app tables; no anon table policies required for this server-owned flow.
- Audit logs for login, uploads, generation, and workflow updates.
- Security headers in `next.config.ts`.
- Rate limiting for login and generation endpoints.
