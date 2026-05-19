import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen bg-background">
      <section className="hidden w-1/2 border-r bg-primary text-primary-foreground lg:flex">
        <div className="flex max-w-xl flex-col justify-between p-12">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Internal platform</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal">
              Jayalath Campus content generation ERP
            </h1>
            <p className="mt-4 text-base leading-7 text-primary-foreground/72">
              Secure role-based workflows for brand-specific social media post planning,
              template governance, and final Canva/n8n production handoff.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-white/12 p-3">RBAC</div>
            <div className="rounded-lg border border-white/12 p-3">Audit logs</div>
            <div className="rounded-lg border border-white/12 p-3">Logo-safe AI</div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">Sign in</h2>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
