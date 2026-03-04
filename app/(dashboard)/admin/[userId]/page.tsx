import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminUserForm } from "@/components/admin-user-form";

export const metadata = { title: "Admin — Edit User" };

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/profile");

  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <p className="text-muted-foreground mt-1">{user.email}</p>
      </div>
      <AdminUserForm user={user} currentAdminId={session.user.id} />
    </div>
  );
}
