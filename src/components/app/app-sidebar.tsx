import Link from "next/link";
import { BarChart3, FileImage, LayoutTemplate, Settings, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import { brandProfiles } from "@/config/brands";
import { can } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard" },
  { href: "/dashboard/manual-edit", label: "Manual Edit", icon: Sparkles, permission: "generatePosts" },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate, permission: "manageTemplates" },
  { href: "/dashboard/assets", label: "Assets", icon: FileImage, permission: "generatePosts" },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow, permission: "manageWorkflows" },
  { href: "/dashboard/users", label: "Users", icon: Users, permission: "manageUsers" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "manageSystem" },
] as const;

export function AppSidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden min-h-screen w-72 border-r bg-sidebar px-4 py-5 lg:block">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Jayalath ERP</p>
          <p className="text-xs text-muted-foreground">Content generation</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {nav
          .filter((item) => can(role, item.permission))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
      </nav>

      <div className="mt-8 rounded-lg border bg-background p-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Brands</p>
        <div className="mt-3 space-y-2">
          {Object.values(brandProfiles).map((brand) => (
            <div key={brand.id} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: brand.accentColor }}
              />
              <span className="truncate">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
