import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/users-table";

export const metadata = { title: "Admin — Users" };

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/profile");

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} {users.length === 1 ? "user" : "users"} registered
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
