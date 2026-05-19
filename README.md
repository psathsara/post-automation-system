# Jayalath Content ERP

Internal ERP-style AI content generation platform for Jayalath Campus and sub-brands.

## Tech stack

- Next.js App Router, TypeScript, Tailwind CSS v4
- ShadCN-style UI primitives
- Firebase Firestore and Storage
- Credentials auth with bcrypt, signed HttpOnly sessions, CSRF, RBAC
- Zod, React Hook Form, Zustand-ready feature structure
- OpenAI provider abstraction, n8n webhook-ready workflow architecture

## Getting started

```powershell
cd "D:\projects\company - work\erp-content-platform"
npm install
npm run dev
```

Open `http://localhost:3000`.

Local development login works with the default accounts even before Firebase is configured. For Firebase-backed auth, copy `.env.example` to `.env.local`, fill the Firebase values, then run `npm run seed:firebase`.

## Default development accounts

- SUPER ADMIN: `admin` / `Admin123`
- ADMIN: `admin` / `Admin1234`
- USER: `user` / `User123`

The two admin accounts share the username because that was requested. For production, use unique usernames and rotate all default passwords.

## Documentation

- `docs/firebase-setup.md`
- `docs/architecture.md`
- `docs/firestore-schema.md`

## Scripts

- `npm run dev` - local development server
- `npm run build` - production build
- `npm run check` - lint and type-check
- `npm run seed:firebase` - seed default users
- `npm run security:audit` - dependency audit excluding dev dependencies
