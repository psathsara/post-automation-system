# Firestore schema

## `users/{userId}`

```ts
{
  username: string;
  usernameLower: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED";
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

## `generationJobs/{jobId}`

```ts
{
  brandId: string;
  brand: BrandProfile;
  tagline: string;
  caption: string;
  content: string;
  language: "si" | "en";
  postType: string;
  theme: string;
  instructions: string;
  assets: UploadedAsset[];
  prompt: string;
  aiPlan: AiPostPlan;
  logoPlacement: LogoPlacement;
  status: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}
```

## `templates/{templateId}`

Planned shape:

```ts
{
  brandId: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  dimensions: { width: number; height: number };
  canvaTemplateId?: string;
  promptBindingId?: string;
  logoPlacement: LogoPlacement;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## `auditLogs/{logId}`

```ts
{
  actorId?: string;
  actorRole?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}
```
