import { UserManager } from "@/features/users/components/user-manager";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">User management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Super admin only. Add, update, disable, and delete local development users.
        </p>
      </div>
      <UserManager />
    </div>
  );
}
