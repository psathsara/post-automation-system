"use client";

import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CSRF_COOKIE } from "@/lib/auth/session";
import { getCookie } from "@/lib/browser/cookies";
import type { ManagedDevUser } from "@/features/auth/dev-users";
import type { Role, UserStatus } from "@/types/auth";

const initialForm = {
  id: "",
  username: "",
  displayName: "",
  role: "USER" as Role,
  status: "ACTIVE" as UserStatus,
  password: "",
};

export function UserManager() {
  const [users, setUsers] = useState<ManagedDevUser[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(form.id);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/users", { cache: "no-store" });

    if (!response.ok) {
      toast.error("Could not load users.");
      setLoading(false);
      return;
    }

    const json = (await response.json()) as { users: ManagedDevUser[] };
    setUsers(json.users);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/users", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load users.");
        }

        return response.json() as Promise<{ users: ManagedDevUser[] }>;
      })
      .then((json) => {
        if (active) {
          setUsers(json.users);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Could not load users.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function editUser(user: ManagedDevUser) {
    setForm({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      password: "",
    });
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      password: form.password || undefined,
    };
    const response = await fetch("/api/users", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save user.");
      return;
    }

    toast.success(isEditing ? "User updated." : "User added.");
    resetForm();
    await loadUsers();
  }

  async function removeUser(user: ManagedDevUser) {
    const response = await fetch("/api/users", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCookie(CSRF_COOKIE) ?? "",
      },
      body: JSON.stringify({ id: user.id }),
    });

    if (!response.ok) {
      toast.error("Could not delete user.");
      return;
    }

    toast.success("User deleted.");
    await loadUsers();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Update user" : "Add user"}</CardTitle>
          <CardDescription>Development users are API-backed and can log in during this local phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveUser}>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isEditing ? "New password" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? "Leave blank to keep current password" : ""}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
                >
                  <option value="SUPER_ADMIN">Super admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as UserStatus }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isEditing ? "Save changes" : "Add"}
              </Button>
              {isEditing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Add, update, disable, or delete local development accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
          {!loading && users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : null}
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{user.displayName}</p>
                  <Badge>{user.role}</Badge>
                  <Badge className={user.status === "ACTIVE" ? "bg-accent text-accent-foreground" : ""}>
                    {user.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => editUser(user)}>
                  <Edit2 className="h-4 w-4" />
                  Update
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => removeUser(user)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
