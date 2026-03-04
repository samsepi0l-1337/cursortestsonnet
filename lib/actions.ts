"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcryptjs from "bcryptjs";
import { auth, signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  loginSchema,
  registerSchema,
  profileFormSchema,
  adminUpdateUserSchema,
} from "@/types";

export async function credentialsSignIn(
  redirectTo: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }

  return null;
}

export async function registerUser(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Invalid input" };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashed = await bcryptjs.hash(parsed.data.password, 12);

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/profile",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign in failed. Please log in." };
    }
    throw error;
  }

  return null;
}

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = profileFormSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    image: formData.get("image"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Invalid input" };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        bio: parsed.data.bio ?? null,
        image: parsed.data.image || null,
      },
    });
  } catch {
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAccount(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await db.user.delete({ where: { id: session.user.id } });
  } catch {
    throw new Error("Failed to delete account. Please try again.");
  }

  await signOut({ redirectTo: "/" });
}

export async function adminUpdateUser(
  userId: string,
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Forbidden" };

  const parsed = adminUpdateUserSchema.safeParse({
    name: formData.get("name") || undefined,
    role: formData.get("role") || undefined,
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Invalid input" };
  }

  if (parsed.data.role !== undefined && userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: parsed.data,
    });
  } catch {
    return { error: "User not found or could not be updated." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${userId}`);
  return { success: true };
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  try {
    await db.user.delete({ where: { id: userId } });
  } catch {
    throw new Error("User not found or could not be deleted.");
  }

  revalidatePath("/admin");
  redirect("/admin");
}
