import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#08111f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)] text-[#08111f] serif text-sm font-semibold">
            L
          </span>
          <span className="serif text-lg tracking-wide">Lumina</span>
        </Link>
        {session ? (
          <nav className="flex items-center gap-4 text-sm text-[var(--mute)]">
            <Link href="/dashboard" className="hover:text-white">
              Home
            </Link>
            <Link href="/courses" className="hover:text-white">
              Courses
            </Link>
            <Link href="/tutor" className="hover:text-white">
              Tutor
            </Link>
            <Link href="/progress" className="hover:text-white">
              Progress
            </Link>
            <Link href="/profile" className="hover:text-white">
              {session.user?.name?.split(" ")[0] ?? "You"}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--gold)]">
                Sign out
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-[var(--mute)] hover:text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-sm font-medium text-[#08111f]"
            >
              Create account
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
