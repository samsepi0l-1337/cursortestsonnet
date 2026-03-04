import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card px-4 py-6">
        <div className="mb-6 px-3">
          <Link href="/profile" className="text-lg font-semibold tracking-tight">
            User Management
          </Link>
        </div>

        <div className="flex-1">
          <DashboardNav isAdmin={isAdmin} />
        </div>

        <div className="border-t pt-4">
          <div className="px-3 mb-3">
            <p className="text-sm font-medium truncate">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
