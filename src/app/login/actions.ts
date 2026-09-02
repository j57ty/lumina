"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard") || "/dashboard";

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password is wrong." };
    }
    throw error;
  }
}
