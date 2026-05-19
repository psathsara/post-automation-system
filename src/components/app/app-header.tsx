import { Moon, Sun } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth/session";

export function AppHeader({ user }: { user: SessionPayload }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <h1 className="text-base font-semibold">{user.displayName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Theme">
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <LogoutButton />
      </div>
    </header>
  );
}
