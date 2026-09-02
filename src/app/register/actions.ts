"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export async function registerUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const gradeLevel = Number(formData.get("gradeLevel") ?? 10);

  if (!name || !email || password.length < 6) {
    return { error: "Name, email, and a password of at least 6 characters are required." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already registered." };

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      gradeLevel: Number.isFinite(gradeLevel) ? gradeLevel : 10,
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { ok: true };
}
