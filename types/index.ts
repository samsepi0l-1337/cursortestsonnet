import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type AdminUpdateUserValues = z.infer<typeof adminUpdateUserSchema>;

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  image: string | null;
  createdAt: Date;
};
