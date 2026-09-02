import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Nav } from "@/components/Nav";

export default function RegisterPage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="serif text-4xl text-[#f6efe2]">Create your desk.</h1>
        <p className="mt-2 text-[var(--mute)]">Two minutes. Then pick a course and talk to the tutor.</p>
        <div className="panel mt-8 rounded-3xl p-6">
          <Suspense fallback={<p>Loading form…</p>}>
            <AuthForm mode="register" />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-[var(--mute)]">
          Already enrolled?{" "}
          <Link href="/login" className="text-[var(--gold)]">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
