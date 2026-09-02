import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Nav } from "@/components/Nav";

export default function LoginPage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="serif text-4xl text-[#f6efe2]">Welcome back.</h1>
        <p className="mt-2 text-[var(--mute)]">Sign in to your dashboard, courses, and tutor.</p>
        <div className="panel mt-8 rounded-3xl p-6">
          <Suspense fallback={<p>Loading form…</p>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-[var(--mute)]">
          New here?{" "}
          <Link href="/register" className="text-[var(--gold)]">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
