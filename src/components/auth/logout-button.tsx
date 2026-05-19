"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/lib/browser/cookies";
import { CSRF_COOKIE } from "@/lib/auth/session";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
    });

    if (!response.ok) {
      toast.error("Could not log out securely.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={logout}>
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
