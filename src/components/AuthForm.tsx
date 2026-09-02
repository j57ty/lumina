"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { registerUser } from "@/app/register/actions";
import { loginUser } from "@/app/login/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (mode === "register") {
        const result = await registerUser(formData);
        if (result?.error) setError(result.error);
        return;
      }
      formData.set("callbackUrl", params.get("callbackUrl") || "/dashboard");
      const result = await loginUser(formData);
      if (result?.error) setError(result.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {mode === "register" && (
        <>
          <label className="block text-sm">
            Name
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[#08111f] px-3 py-2 outline-none focus:border-[var(--gold)]"
            />
          </label>
          <label className="block text-sm">
            Grade
            <select
              name="gradeLevel"
              defaultValue="10"
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[#08111f] px-3 py-2 outline-none focus:border-[var(--gold)]"
            >
              {[9, 10, 11, 12].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <label className="block text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[#08111f] px-3 py-2 outline-none focus:border-[var(--gold)]"
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[#08111f] px-3 py-2 outline-none focus:border-[var(--gold)]"
        />
      </label>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-full bg-[var(--gold)] py-2.5 text-sm font-medium text-[#08111f] disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
