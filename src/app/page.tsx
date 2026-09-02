import Link from "next/link";
import { Nav } from "@/components/Nav";

const subjects = [
  "Algebra through Precalculus",
  "Biology, Chemistry, Physics",
  "U.S. & World History",
  "Composition and Literature",
  "Civics, Economics, CS, Spanish, Health",
];

export default function HomePage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">High school academy</p>
        <h1 className="serif mt-4 max-w-3xl text-5xl leading-tight text-[#f6efe2] md:text-6xl">
          Every core course. One tutor that can talk back.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--mute)]">
          Lumina is a full learning site for high-school students: accounts, a course catalog,
          lessons, quizzes, streaks, and an agentic tutor that can search the curriculum and speak
          the explanation out loud.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-medium text-[#08111f]"
          >
            Start learning
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-[var(--gold-2)]"
          >
            I already have an account
          </Link>
        </div>
        <div className="gold-rule my-14" />
        <div className="grid gap-4 md:grid-cols-5">
          {subjects.map((item) => (
            <div key={item} className="panel rounded-2xl p-4 text-sm text-[var(--mist)]">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-[var(--mute)]">
          Demo account after you seed the database: ada@lumina.edu / demo1234
        </p>
      </main>
    </div>
  );
}
